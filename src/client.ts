import { readConfig } from "./config.js";

const BASE_URL = "https://server.smartlead.ai/api/v1";

export const EXIT_OK = 0;
export const EXIT_ERROR = 1;
export const EXIT_AUTH = 2;
export const EXIT_NOT_FOUND = 3;
export const EXIT_RATE_LIMITED = 4;

export class CliError extends Error {
  constructor(
    message: string,
    public exitCode: number = EXIT_ERROR,
  ) {
    super(message);
    this.name = "CliError";
  }
}

export interface RequestOptions {
  method?: string;
  path: string;
  params?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  /** Return raw text instead of parsing JSON. */
  rawText?: boolean;
}

/**
 * Mask an API key for safe display in error messages.
 * Shows only the last 4 characters.
 */
function maskApiKey(key: string): string {
  if (key.length <= 4) return "****";
  return "****" + key.slice(-4);
}

/**
 * Strip the api_key query parameter value from a URL string,
 * replacing it with a masked version.
 */
function sanitizeUrl(url: string, apiKey: string): string {
  return url.replace(encodeURIComponent(apiKey), maskApiKey(apiKey)).replace(apiKey, maskApiKey(apiKey));
}

/** Default maximum number of retries for 429 responses. */
const DEFAULT_MAX_RETRIES = 3;

/** Sleep helper. */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class SmartLeadClient {
  private apiKey: string;
  private userAgent: string;
  private baseUrl: string;
  private retryEnabled: boolean;
  private maxRetries: number;

  constructor(apiKey?: string, baseUrl?: string, retry?: boolean) {
    const resolved =
      apiKey ??
      process.env["SMARTLEAD_API_KEY"] ??
      readConfig().api_key;

    if (!resolved) {
      throw new CliError(
        "API key required. Pass --api-key, set SMARTLEAD_API_KEY, or run: smartlead config set api_key <key>",
        EXIT_AUTH,
      );
    }

    this.apiKey = resolved;
    this.baseUrl = baseUrl ?? BASE_URL;
    this.retryEnabled = retry ?? false;
    this.maxRetries = DEFAULT_MAX_RETRIES;

    // Read version from package.json at build time isn't straightforward in ESM,
    // so we hardcode and keep in sync with package.json.
    this.userAgent = "smartlead-cli/0.1.0";
  }

  async request<T>(opts: RequestOptions): Promise<T> {
    const url = new URL(`${this.baseUrl}${opts.path}`);
    url.searchParams.set("api_key", this.apiKey);

    if (opts.params) {
      for (const [key, value] of Object.entries(opts.params)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const headers: Record<string, string> = {
      "User-Agent": this.userAgent,
    };

    let requestBody: string | undefined;
    if (opts.body !== undefined) {
      headers["Content-Type"] = "application/json";
      requestBody = JSON.stringify(opts.body);
    }

    let attempt = 0;
    const maxAttempts = this.retryEnabled ? this.maxRetries + 1 : 1;

    while (attempt < maxAttempts) {
      attempt++;

      const response = await fetch(url.toString(), {
        method: opts.method ?? "GET",
        headers,
        body: requestBody,
      });

      if (response.status === 401 || response.status === 403) {
        throw new CliError("Authentication failed. Check your API key.", EXIT_AUTH);
      }

      if (response.status === 404) {
        const text = await response.text().catch(() => "");
        throw new CliError(
          `Not found: ${opts.path}${text ? " — " + text : ""}`,
          EXIT_NOT_FOUND,
        );
      }

      // Handle rate limiting (429)
      if (response.status === 429) {
        const retryAfterHeader = response.headers.get("retry-after");
        const retryAfterSeconds = retryAfterHeader ? parseInt(retryAfterHeader, 10) : undefined;
        const retryAfterDisplay = retryAfterSeconds && !isNaN(retryAfterSeconds) ? retryAfterSeconds : "unknown";
        const text = await response.text().catch(() => "");

        // If retry is enabled and we have attempts remaining, back off and retry
        if (this.retryEnabled && attempt < maxAttempts) {
          const baseDelay = (retryAfterSeconds && !isNaN(retryAfterSeconds))
            ? retryAfterSeconds * 1000
            : 1000;
          // Exponential backoff: baseDelay * 2^(attempt-1)
          const delay = baseDelay * Math.pow(2, attempt - 1);
          process.stderr.write(
            `Rate limited. Retry after ${retryAfterDisplay} seconds. Retrying in ${Math.ceil(delay / 1000)}s (attempt ${attempt}/${maxAttempts})...\n`,
          );
          await sleep(delay);
          continue;
        }

        // No retry — throw
        throw new CliError(
          `Rate limited. Retry after ${retryAfterDisplay} seconds.${text ? " " + text : ""}`,
          EXIT_RATE_LIMITED,
        );
      }

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new CliError(
          `API error ${response.status}: ${text || response.statusText}`,
          EXIT_ERROR,
        );
      }

      if (opts.rawText) {
        return (await response.text()) as T;
      }
      const text = await response.text();
      if (!text) {
        return null as T;
      }
      return JSON.parse(text) as T;
    }

    // Should not be reached, but satisfy TypeScript
    throw new CliError("Max retries exceeded", EXIT_RATE_LIMITED);
  }
}
