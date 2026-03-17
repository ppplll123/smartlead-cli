import { readFileSync } from "node:fs";
import { Command } from "commander";
import { SmartLeadClient, CliError, EXIT_ERROR } from "../client.js";
import { printData, printError, detectFormat, type OutputFormat } from "../output.js";
import { validated } from "../schemas/validate.js";
import { ClientListSchema, ClientCreateSchema, ApiKeyListSchema, OkResponseSchema } from "../schemas/clients.schema.js";

function resolveFormat(program: Command): OutputFormat {
  const f = program.opts()["format"] as string | undefined;
  if (f === "json" || f === "table" || f === "csv") return f;
  return detectFormat();
}

function makeClient(program: Command): SmartLeadClient {
  const opts = program.opts();
  return new SmartLeadClient(opts["apiKey"] as string | undefined, undefined, opts["retry"] as boolean | undefined);
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

export function registerClientsCommand(program: Command): void {
  const cmd = program.command("clients").description("Manage clients and API keys");

  // ── clients create ────────────────────────────────────────────────────
  // POST /client/save
  cmd
    .command("create")
    .description("Create or update a client")
    .requiredOption("--from-json <path>", "JSON file with email, name, and optional fields")
    .action(async (opts) => {
      const client = makeClient(program);
      const body = loadJson(opts.fromJson);
      const data = await client.request<unknown>({
        method: "POST",
        path: "/client/save",
        body,
      });
      printData(validated(data, ClientCreateSchema), resolveFormat(program));
    });

  // ── clients list ──────────────────────────────────────────────────────
  // GET /client
  cmd
    .command("list")
    .description("List all clients")
    .action(async () => {
      const client = makeClient(program);
      const data = await client.request<unknown>({
        path: "/client",
      });
      printData(validated(data, ClientListSchema), resolveFormat(program));
    });

  // ── clients create-key ────────────────────────────────────────────────
  // POST /client/api-key
  cmd
    .command("create-key")
    .description("Create an API key for a client")
    .requiredOption("--client-id <id>", "Client ID", parseInt)
    .requiredOption("--key-name <name>", "Key name (alphanumeric, hyphens, underscores)")
    .action(async (opts) => {
      const client = makeClient(program);
      const data = await client.request<unknown>({
        method: "POST",
        path: "/client/api-key",
        body: { clientId: opts.clientId, keyName: opts.keyName },
      });
      printData(validated(data, OkResponseSchema), resolveFormat(program));
    });

  // ── clients keys ──────────────────────────────────────────────────────
  // GET /client/api-key
  cmd
    .command("keys")
    .description("List API keys for a client")
    .option("--client-id <id>", "Filter by client ID", parseInt)
    .option("--status <s>", "Filter: active|inactive")
    .option("--key-name <name>", "Filter by key name")
    .action(async (opts) => {
      const client = makeClient(program);
      const data = await client.request<unknown>({
        path: "/client/api-key",
        params: {
          clientId: opts.clientId,
          status: opts.status,
          keyName: opts.keyName,
        },
      });
      printData(validated(data, ApiKeyListSchema), resolveFormat(program));
    });

  // ── clients delete-key ────────────────────────────────────────────────
  // DELETE /client/api-key/:id
  cmd
    .command("delete-key")
    .description("Delete a client API key")
    .requiredOption("--key-id <id>", "API key ID", parseInt)
    .option("--confirm", "Confirm deletion")
    .action(async (opts) => {
      if (!opts.confirm) {
        printError("Pass --confirm to delete API key " + opts.keyId);
        process.exit(EXIT_ERROR);
      }
      const client = makeClient(program);
      const data = await client.request<unknown>({
        method: "DELETE",
        path: `/client/api-key/${opts.keyId}`,
      });
      printData(validated(data, OkResponseSchema), resolveFormat(program));
    });

  // ── clients reset-key ─────────────────────────────────────────────────
  // PUT /client/api-key/reset/:id
  cmd
    .command("reset-key")
    .description("Reset (regenerate) a client API key")
    .requiredOption("--key-id <id>", "API key ID", parseInt)
    .action(async (opts) => {
      const client = makeClient(program);
      const data = await client.request<unknown>({
        method: "PUT",
        path: `/client/api-key/reset/${opts.keyId}`,
      });
      printData(validated(data, OkResponseSchema), resolveFormat(program));
    });
}
