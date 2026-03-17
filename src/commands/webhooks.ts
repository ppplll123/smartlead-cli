import { readFileSync } from "node:fs";
import { Command } from "commander";
import { SmartLeadClient, CliError, EXIT_ERROR } from "../client.js";
import { printData, printError, detectFormat, type OutputFormat } from "../output.js";
import { validated } from "../schemas/validate.js";
import { WebhookListSchema, WebhookSummarySchema, OkResponseSchema } from "../schemas/webhooks.schema.js";

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

export function registerWebhooksCommand(program: Command): void {
  const cmd = program.command("webhooks").description("Manage campaign webhooks");

  // ── webhooks list ─────────────────────────────────────────────────────
  // GET /campaigns/:campaign_id/webhooks
  cmd
    .command("list")
    .description("List webhooks for a campaign")
    .requiredOption("--campaign-id <id>", "Campaign ID", parseInt)
    .action(async (opts) => {
      const client = makeClient(program);
      const data = await client.request<unknown>({
        path: `/campaigns/${opts.campaignId}/webhooks`,
      });
      printData(validated(data, WebhookListSchema), resolveFormat(program));
    });

  // ── webhooks upsert ───────────────────────────────────────────────────
  // POST /campaigns/:campaign_id/webhooks
  cmd
    .command("upsert")
    .description("Create or update a campaign webhook")
    .requiredOption("--campaign-id <id>", "Campaign ID", parseInt)
    .requiredOption("--from-json <path>", "JSON file with name, webhook_url, event_types, optional id")
    .action(async (opts) => {
      const client = makeClient(program);
      const body = loadJson(opts.fromJson);
      const data = await client.request<unknown>({
        method: "POST",
        path: `/campaigns/${opts.campaignId}/webhooks`,
        body,
      });
      printData(validated(data, OkResponseSchema), resolveFormat(program));
    });

  // ── webhooks delete ───────────────────────────────────────────────────
  // DELETE /campaigns/:campaign_id/webhooks
  cmd
    .command("delete")
    .description("Delete a webhook from a campaign")
    .requiredOption("--campaign-id <id>", "Campaign ID", parseInt)
    .requiredOption("--webhook-id <id>", "Webhook ID", parseInt)
    .option("--confirm", "Confirm deletion")
    .action(async (opts) => {
      if (!opts.confirm) {
        printError(
          `Pass --confirm to delete webhook ${opts.webhookId} from campaign ${opts.campaignId}`,
        );
        process.exit(EXIT_ERROR);
      }
      const client = makeClient(program);
      const data = await client.request<unknown>({
        method: "DELETE",
        path: `/campaigns/${opts.campaignId}/webhooks`,
        body: { id: opts.webhookId },
      });
      printData(validated(data, OkResponseSchema), resolveFormat(program));
    });

  // ── webhooks summary ──────────────────────────────────────────────────
  // GET /campaigns/:campaignId/webhooks/summary
  cmd
    .command("summary")
    .description("Get webhook execution summary for a campaign")
    .requiredOption("--campaign-id <id>", "Campaign ID", parseInt)
    .requiredOption("--from <date>", "Start date (ISO format)")
    .requiredOption("--to <date>", "End date (ISO format)")
    .action(async (opts) => {
      const client = makeClient(program);
      const data = await client.request<unknown>({
        path: `/campaigns/${opts.campaignId}/webhooks/summary`,
        params: {
          fromTime: opts.from,
          toTime: opts.to,
        },
      });
      printData(validated(data, WebhookSummarySchema), resolveFormat(program));
    });

  // ── webhooks retrigger ────────────────────────────────────────────────
  // POST /campaigns/:campaignId/webhooks/retrigger-failed-events
  cmd
    .command("retrigger")
    .description("Retrigger failed webhook events for a campaign")
    .requiredOption("--campaign-id <id>", "Campaign ID", parseInt)
    .requiredOption("--from <date>", "Start date (ISO format)")
    .requiredOption("--to <date>", "End date (ISO format)")
    .action(async (opts) => {
      const client = makeClient(program);
      const data = await client.request<unknown>({
        method: "POST",
        path: `/campaigns/${opts.campaignId}/webhooks/retrigger-failed-events`,
        body: {
          fromTime: opts.from,
          toTime: opts.to,
        },
      });
      printData(validated(data, OkResponseSchema), resolveFormat(program));
    });
}
