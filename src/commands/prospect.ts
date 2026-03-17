import { readFileSync } from "node:fs";
import { Command } from "commander";
import { SmartLeadClient, CliError, EXIT_ERROR } from "../client.js";
import { readConfig } from "../config.js";
import { printData, detectFormat, type OutputFormat } from "../output.js";
import { validated } from "../schemas/validate.js";
import {
  LookupListSchema, SearchResultSchema, FetchResultSchema,
  FindEmailsSchema, ReviewResultSchema, SavedSearchesSchema,
  RecentSearchesSchema, FetchedSearchesSchema, SearchAnalyticsSchema,
  ReplyAnalyticsSchema, OkMessageSchema,
} from "../schemas/prospect.schema.js";

const PROSPECT_BASE_URL = "https://prospect-api.smartlead.ai/api/v1/search-email-leads";

function resolveFormat(program: Command): OutputFormat {
  const f = program.opts()["format"] as string | undefined;
  if (f === "json" || f === "table" || f === "csv") return f;
  return detectFormat();
}

function makeProspectClient(program: Command): SmartLeadClient {
  const baseUrl =
    process.env["SMARTLEAD_PROSPECT_API_URL"] ??
    readConfig().prospect_api_url ??
    PROSPECT_BASE_URL;
  const opts = program.opts();
  return new SmartLeadClient(
    opts["apiKey"] as string | undefined,
    baseUrl,
    opts["retry"] as boolean | undefined,
  );
}

function loadJson(path: string): unknown {
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch (err) {
    throw new CliError(
      `Failed to read JSON from ${path}: ${err instanceof Error ? err.message : err}`,
      EXIT_ERROR,
    );
  }
}

/** Register a GET lookup subcommand with --query, --limit, --offset. */
function addLookupCommand(
  parent: Command,
  program: Command,
  name: string,
  description: string,
  apiPath: string,
  extraOpts?: (c: Command) => void,
): void {
  const c = parent
    .command(name)
    .description(description)
    .option("--query <search>", "Search / filter string")
    .option("--limit <n>", "Max results (1-100, default 10)", parseInt)
    .option("--offset <n>", "Skip first N results", parseInt);
  if (extraOpts) extraOpts(c);
  c.action(async (opts) => {
    const client = makeProspectClient(program);
    const params: Record<string, string | number | boolean | undefined> = {
      search: opts.query,
      limit: opts.limit,
      offset: opts.offset,
    };
    // Forward any extra filter params
    if (opts.state) params["state"] = opts.state;
    if (opts.country) params["country"] = opts.country;
    if (opts.industryId) params["industry_id"] = opts.industryId;
    if (opts.withSubIndustry !== undefined)
      params["withSubIndustry"] = opts.withSubIndustry;
    const data = await client.request<unknown>({ path: apiPath, params });
    printData(validated(data, LookupListSchema), resolveFormat(program));
  });
}

export function registerProspectCommand(program: Command): void {
  const cmd = program
    .command("prospect")
    .description("Prospect search, lookups, and lead enrichment");

  // ═══════════════════════════════════════════════════════════════════════
  //  Lookup endpoints (all GET)
  // ═══════════════════════════════════════════════════════════════════════

  addLookupCommand(cmd, program, "departments", "List departments", "/departments");

  addLookupCommand(cmd, program, "cities", "List cities", "/cities", (c) => {
    c.option("--state <state>", "Filter by state");
    c.option("--country <country>", "Filter by country");
  });

  addLookupCommand(cmd, program, "countries", "List countries", "/countries");

  addLookupCommand(cmd, program, "states", "List states", "/states", (c) => {
    c.option("--country <country>", "Filter by country");
  });

  addLookupCommand(cmd, program, "industries", "List industries", "/industries", (c) => {
    c.option("--with-sub-industry <bool>", "Include sub-industries (true|false)");
  });

  addLookupCommand(cmd, program, "sub-industries", "List sub-industries", "/sub-industries", (c) => {
    c.option("--industry-id <id>", "Filter by industry ID");
  });

  addLookupCommand(cmd, program, "headcounts", "List headcount ranges", "/head-counts");
  addLookupCommand(cmd, program, "levels", "List seniority levels", "/levels");
  addLookupCommand(cmd, program, "revenue", "List revenue ranges", "/revenue");
  addLookupCommand(cmd, program, "companies", "Search companies", "/company");
  addLookupCommand(cmd, program, "domains", "Search domains", "/domain");
  addLookupCommand(cmd, program, "job-titles", "Search job titles", "/job-title");
  addLookupCommand(cmd, program, "keywords", "Search keywords", "/keywords");

  // ═══════════════════════════════════════════════════════════════════════
  //  Search / fetch actions (POST)
  // ═══════════════════════════════════════════════════════════════════════

  // ── prospect search ───────────────────────────────────────────────────
  // POST /search-contacts
  cmd
    .command("search")
    .description("Search for prospect contacts")
    .requiredOption("--from-json <path>", "JSON file with search filters")
    .action(async (opts) => {
      const client = makeProspectClient(program);
      const body = loadJson(opts.fromJson);
      const data = await client.request<unknown>({
        method: "POST",
        path: "/search-contacts",
        body,
      });
      printData(validated(data, SearchResultSchema), resolveFormat(program));
    });

  // ── prospect fetch ────────────────────────────────────────────────────
  // POST /fetch-contacts
  cmd
    .command("fetch")
    .description("Fetch contact details (consumes credits)")
    .requiredOption("--from-json <path>", "JSON file with filter_id, id or limit")
    .action(async (opts) => {
      const client = makeProspectClient(program);
      const body = loadJson(opts.fromJson);
      const data = await client.request<unknown>({
        method: "POST",
        path: "/fetch-contacts",
        body,
      });
      printData(validated(data, FetchResultSchema), resolveFormat(program));
    });

  // ── prospect get ──────────────────────────────────────────────────────
  // POST /get-contacts
  cmd
    .command("get")
    .description("Get previously fetched contacts")
    .requiredOption("--from-json <path>", "JSON file with id array or filter_id, optional limit/offset")
    .action(async (opts) => {
      const client = makeProspectClient(program);
      const body = loadJson(opts.fromJson);
      const data = await client.request<unknown>({
        method: "POST",
        path: "/get-contacts",
        body,
      });
      printData(validated(data, FetchResultSchema), resolveFormat(program));
    });

  // ── prospect find-emails ──────────────────────────────────────────────
  // POST /search-contacts/find-emails
  cmd
    .command("find-emails")
    .description("Find emails for contacts (max 10 per request)")
    .requiredOption("--from-json <path>", "JSON file with contacts array [{firstName, lastName, companyDomain}]")
    .action(async (opts) => {
      const client = makeProspectClient(program);
      const body = loadJson(opts.fromJson);
      const data = await client.request<unknown>({
        method: "POST",
        path: "/search-contacts/find-emails",
        body,
      });
      printData(validated(data, FindEmailsSchema), resolveFormat(program));
    });

  // ═══════════════════════════════════════════════════════════════════════
  //  Review
  // ═══════════════════════════════════════════════════════════════════════

  // ── prospect review ───────────────────────────────────────────────────
  // PATCH /review-contacts/:filter_id
  cmd
    .command("review")
    .description("Review fetched contacts for a filter")
    .requiredOption("--filter-id <id>", "Filter ID", parseInt)
    .action(async (opts) => {
      const client = makeProspectClient(program);
      const data = await client.request<unknown>({
        method: "PATCH",
        path: `/review-contacts/${opts.filterId}`,
      });
      printData(validated(data, ReviewResultSchema), resolveFormat(program));
    });

  // ═══════════════════════════════════════════════════════════════════════
  //  Saved search management
  // ═══════════════════════════════════════════════════════════════════════

  // ── prospect saved-searches ───────────────────────────────────────────
  // GET /search-filters/saved-searches
  cmd
    .command("saved-searches")
    .description("List saved searches")
    .option("--limit <n>", "Max results (default 10)", parseInt)
    .option("--offset <n>", "Skip first N results", parseInt)
    .action(async (opts) => {
      const client = makeProspectClient(program);
      const data = await client.request<unknown>({
        path: "/search-filters/saved-searches",
        params: { limit: opts.limit, offset: opts.offset },
      });
      printData(validated(data, SavedSearchesSchema), resolveFormat(program));
    });

  // ── prospect recent-searches ──────────────────────────────────────────
  // GET /search-filters/recent-searches
  cmd
    .command("recent-searches")
    .description("List recent searches")
    .option("--limit <n>", "Max results (default 10)", parseInt)
    .option("--offset <n>", "Skip first N results", parseInt)
    .action(async (opts) => {
      const client = makeProspectClient(program);
      const data = await client.request<unknown>({
        path: "/search-filters/recent-searches",
        params: { limit: opts.limit, offset: opts.offset },
      });
      printData(validated(data, RecentSearchesSchema), resolveFormat(program));
    });

  // ── prospect fetched-searches ─────────────────────────────────────────
  // GET /search-filters/fetched-searches
  cmd
    .command("fetched-searches")
    .description("List fetched lead searches")
    .option("--limit <n>", "Max results (default 10)", parseInt)
    .option("--offset <n>", "Skip first N results", parseInt)
    .action(async (opts) => {
      const client = makeProspectClient(program);
      const data = await client.request<unknown>({
        path: "/search-filters/fetched-searches",
        params: { limit: opts.limit, offset: opts.offset },
      });
      printData(validated(data, FetchedSearchesSchema), resolveFormat(program));
    });

  // ── prospect save-search ──────────────────────────────────────────────
  // POST /search-filters/save-search
  cmd
    .command("save-search")
    .description("Save a search with filters")
    .requiredOption("--from-json <path>", "JSON file with search_string and filter params")
    .action(async (opts) => {
      const client = makeProspectClient(program);
      const body = loadJson(opts.fromJson);
      const data = await client.request<unknown>({
        method: "POST",
        path: "/search-filters/save-search",
        body,
      });
      printData(validated(data, OkMessageSchema), resolveFormat(program));
    });

  // ── prospect update-search ────────────────────────────────────────────
  // PUT /search-filters/save-search/:id
  cmd
    .command("update-search")
    .description("Update a saved search name")
    .requiredOption("--id <id>", "Saved search ID", parseInt)
    .requiredOption("--from-json <path>", "JSON file with search_string")
    .action(async (opts) => {
      const client = makeProspectClient(program);
      const body = loadJson(opts.fromJson);
      const data = await client.request<unknown>({
        method: "PUT",
        path: `/search-filters/save-search/${opts.id}`,
        body,
      });
      printData(validated(data, OkMessageSchema), resolveFormat(program));
    });

  // ── prospect update-fetched ───────────────────────────────────────────
  // PUT /search-filters/fetched-searches/:id
  cmd
    .command("update-fetched")
    .description("Update a fetched search name")
    .requiredOption("--id <id>", "Fetched search ID", parseInt)
    .requiredOption("--from-json <path>", "JSON file with search_string")
    .action(async (opts) => {
      const client = makeProspectClient(program);
      const body = loadJson(opts.fromJson);
      const data = await client.request<unknown>({
        method: "PUT",
        path: `/search-filters/fetched-searches/${opts.id}`,
        body,
      });
      printData(validated(data, OkMessageSchema), resolveFormat(program));
    });

  // ═══════════════════════════════════════════════════════════════════════
  //  Analytics
  // ═══════════════════════════════════════════════════════════════════════

  // ── prospect search-analytics ─────────────────────────────────────────
  // GET /search-analytics
  cmd
    .command("search-analytics")
    .description("Get prospect search analytics and credit usage")
    .option("--filter-id <id>", "Filter ID for specific search stats")
    .action(async (opts) => {
      const client = makeProspectClient(program);
      const data = await client.request<unknown>({
        path: "/search-analytics",
        params: { filter_id: opts.filterId },
      });
      printData(validated(data, SearchAnalyticsSchema), resolveFormat(program));
    });

  // ── prospect reply-analytics ──────────────────────────────────────────
  // GET /reply-analytics
  cmd
    .command("reply-analytics")
    .description("Get reply analytics for prospects (current vs previous month)")
    .action(async () => {
      const client = makeProspectClient(program);
      const data = await client.request<unknown>({
        path: "/reply-analytics",
      });
      printData(validated(data, ReplyAnalyticsSchema), resolveFormat(program));
    });
}
