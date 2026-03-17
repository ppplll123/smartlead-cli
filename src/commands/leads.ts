import { readFileSync } from "node:fs";
import { Command } from "commander";
import { SmartLeadClient, CliError, EXIT_ERROR } from "../client.js";
import { printData, printError, detectFormat, type OutputFormat } from "../output.js";
import { validated } from "../schemas/validate.js";
import {
  CampaignLeadsSchema, LeadByEmailSchema, LeadCategoriesSchema,
  AllLeadsResponseSchema, OkMessageSchema, BlocklistSchema,
} from "../schemas/leads.schema.js";

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

/**
 * Cursor-based auto-paginator for the /leads/all endpoint.
 * Keeps fetching until fewer results than `limit` come back
 * or the API stops returning a lastSeenLeadId-equivalent.
 */
async function paginateAll(
  client: SmartLeadClient,
  path: string,
  baseParams: Record<string, string | number | boolean | undefined>,
  limit: number,
): Promise<unknown[]> {
  const all: unknown[] = [];
  let lastSeenLeadId: number | undefined;

  for (;;) {
    const params = { ...baseParams, limit, lastSeenLeadId };
    const page = await client.request<unknown[]>({ path, params });
    if (!Array.isArray(page) || page.length === 0) break;
    all.push(...page);
    if (page.length < limit) break;
    // The /leads/all endpoint uses cursor-based pagination via lastSeenLeadId
    const last = page[page.length - 1] as Record<string, unknown> | undefined;
    const nextCursor = last?.["id"] ?? last?.["lead_id"];
    if (typeof nextCursor !== "number") break;
    lastSeenLeadId = nextCursor;
  }
  return all;
}

/**
 * Offset-based auto-paginator for endpoints that use offset/limit.
 */
async function paginateOffset(
  client: SmartLeadClient,
  path: string,
  baseParams: Record<string, string | number | boolean | undefined>,
  limit: number,
): Promise<unknown[]> {
  const all: unknown[] = [];
  let offset = 0;

  for (;;) {
    const params = { ...baseParams, limit, offset };
    const page = await client.request<unknown[]>({ path, params });
    if (!Array.isArray(page) || page.length === 0) break;
    all.push(...page);
    if (page.length < limit) break;
    offset += page.length;
  }
  return all;
}

export function registerLeadsCommand(program: Command): void {
  const cmd = program.command("leads").description("Manage leads");

  // ── leads list ────────────────────────────────────────────────────────
  // GET /campaigns/:campaign_id/leads
  cmd
    .command("list")
    .description("List leads in a campaign")
    .requiredOption("--campaign-id <id>", "Campaign ID", parseInt)
    .option("--status <s>", "Filter: STARTED|INPROGRESS|COMPLETED|PAUSED|STOPPED")
    .option("--limit <n>", "Max results per page (1-100, default 100)", parseInt)
    .option("--offset <n>", "Skip first N results", parseInt)
    .option("--lead-category-id <id>", "Filter by category ID", parseInt)
    .option("--email-status <s>", "Filter by email event status")
    .option("--all", "Auto-paginate to fetch every lead")
    .action(async (opts) => {
      const client = makeClient(program);
      const limit = opts.limit ?? 100;
      const params: Record<string, string | number | boolean | undefined> = {
        status: opts.status,
        lead_category_id: opts.leadCategoryId,
        emailStatus: opts.emailStatus,
      };

      if (opts.all) {
        const data = await paginateOffset(
          client,
          `/campaigns/${opts.campaignId}/leads`,
          params,
          limit,
        );
        printData(validated(data, CampaignLeadsSchema), resolveFormat(program));
      } else {
        const data = await client.request<unknown>({
          path: `/campaigns/${opts.campaignId}/leads`,
          params: { ...params, limit, offset: opts.offset },
        });
        printData(validated(data, CampaignLeadsSchema), resolveFormat(program));
      }
    });

  // ── leads list-all ────────────────────────────────────────────────────
  // GET /leads/all  (cursor-based via lastSeenLeadId)
  cmd
    .command("list-all")
    .description("List leads across all campaigns")
    .option("--limit <n>", "Max results per page (1-1000, default 100)", parseInt)
    .option("--offset <n>", "Starting offset (first page only)", parseInt)
    .option("--campaign-id <id>", "Filter by campaign", parseInt)
    .option("--status <s>", "Filter: STARTED|INPROGRESS|STOPPED|PAUSED|BLOCKED|COMPLETED")
    .option("--email-status <s>", "Filter by email event status")
    .option("--lead-type <type>", "Filter: active|yet_to_use|previously_active|archived")
    .option("--list-id <id>", "Filter by list", parseInt)
    .option("--client-id <id>", "Filter by client", parseInt)
    .option("--lead-email <email>", "Search by email address")
    .option("--all", "Auto-paginate to fetch every lead")
    .action(async (opts) => {
      const client = makeClient(program);
      const limit = opts.limit ?? 100;
      const params: Record<string, string | number | boolean | undefined> = {
        campaignId: opts.campaignId,
        status: opts.status,
        emailStatus: opts.emailStatus,
        leadType: opts.leadType,
        listId: opts.listId,
        clientId: opts.clientId,
        leadEmail: opts.leadEmail,
      };

      if (opts.all) {
        const data = await paginateAll(client, "/leads/all", params, limit);
        printData(validated(data, AllLeadsResponseSchema), resolveFormat(program));
      } else {
        const data = await client.request<unknown>({
          path: "/leads/all",
          params: { ...params, limit, lastSeenLeadId: opts.offset },
        });
        printData(validated(data, AllLeadsResponseSchema), resolveFormat(program));
      }
    });

  // ── leads get-by-email ────────────────────────────────────────────────
  // GET /leads?email=...
  cmd
    .command("get-by-email")
    .description("Look up leads by email address")
    .requiredOption("--email <email>", "Email address to search")
    .action(async (opts) => {
      const client = makeClient(program);
      const data = await client.request<unknown>({
        path: "/leads",
        params: { email: opts.email },
      });
      printData(validated(data, LeadByEmailSchema), resolveFormat(program));
    });

  // ── leads categories ──────────────────────────────────────────────────
  // GET /leads/fetch-categories
  cmd
    .command("categories")
    .description("List all lead categories")
    .action(async () => {
      const client = makeClient(program);
      const data = await client.request<unknown>({
        path: "/leads/fetch-categories",
      });
      printData(validated(data, LeadCategoriesSchema), resolveFormat(program));
    });

  // ── leads overview ────────────────────────────────────────────────────
  // GET /leads/:leadId/campaign-overview
  cmd
    .command("overview")
    .description("Get campaign overview for a lead")
    .requiredOption("--lead-id <id>", "Lead ID", parseInt)
    .action(async (opts) => {
      const client = makeClient(program);
      const data = await client.request<unknown>({
        path: `/leads/${opts.leadId}/campaign-overview`,
      });
      printData(validated(data, OkMessageSchema), resolveFormat(program));
    });

  // ── leads sequence-details ────────────────────────────────────────────
  // GET /leads/:leadMapId/sequence-details
  cmd
    .command("sequence-details")
    .description("Get sequence details for a lead")
    .requiredOption("--lead-map-id <id>", "Lead map ID", parseInt)
    .option("--campaign-id <id>", "Campaign ID", parseInt)
    .action(async (opts) => {
      const client = makeClient(program);
      const data = await client.request<unknown>({
        path: `/leads/${opts.leadMapId}/sequence-details`,
        params: { campaignId: opts.campaignId },
      });
      printData(validated(data, OkMessageSchema), resolveFormat(program));
    });

  // ── leads add ─────────────────────────────────────────────────────────
  // POST /campaigns/:campaign_id/leads
  cmd
    .command("add")
    .description("Add leads to a campaign")
    .requiredOption("--campaign-id <id>", "Campaign ID", parseInt)
    .requiredOption("--from-json <path>", "JSON file with lead_list and optional settings")
    .action(async (opts) => {
      const client = makeClient(program);
      const body = loadJson(opts.fromJson);
      const data = await client.request<unknown>({
        method: "POST",
        path: `/campaigns/${opts.campaignId}/leads`,
        body,
      });
      printData(validated(data, OkMessageSchema), resolveFormat(program));
    });

  // ── leads push ────────────────────────────────────────────────────────
  // POST /leads/push-to-campaign
  cmd
    .command("push")
    .description("Push leads to a campaign (copy or move)")
    .requiredOption("--from-json <path>", "JSON file with campaignId, action, leadList")
    .action(async (opts) => {
      const client = makeClient(program);
      const body = loadJson(opts.fromJson);
      const data = await client.request<unknown>({
        method: "POST",
        path: "/leads/push-to-campaign",
        body,
      });
      printData(validated(data, OkMessageSchema), resolveFormat(program));
    });

  // ── leads update ──────────────────────────────────────────────────────
  // POST /campaigns/:campaign_id/leads/:lead_id/
  cmd
    .command("update")
    .description("Update a lead in a campaign")
    .requiredOption("--campaign-id <id>", "Campaign ID", parseInt)
    .requiredOption("--lead-id <id>", "Lead ID", parseInt)
    .requiredOption("--from-json <path>", "JSON file with lead fields")
    .action(async (opts) => {
      const client = makeClient(program);
      const body = loadJson(opts.fromJson);
      const data = await client.request<unknown>({
        method: "POST",
        path: `/campaigns/${opts.campaignId}/leads/${opts.leadId}`,
        body,
      });
      printData(validated(data, OkMessageSchema), resolveFormat(program));
    });

  // ── leads update-category ─────────────────────────────────────────────
  // POST /campaigns/:campaign_id/leads/:lead_id/category
  cmd
    .command("update-category")
    .description("Update lead category in a campaign")
    .requiredOption("--campaign-id <id>", "Campaign ID", parseInt)
    .requiredOption("--lead-id <id>", "Lead ID", parseInt)
    .requiredOption("--category-id <id>", "Category ID (null to clear)", (v) =>
      v === "null" ? null : parseInt(v),
    )
    .option("--pause-lead", "Pause the lead after categorizing")
    .action(async (opts) => {
      const client = makeClient(program);
      const data = await client.request<unknown>({
        method: "POST",
        path: `/campaigns/${opts.campaignId}/leads/${opts.leadId}/category`,
        body: {
          category_id: opts.categoryId,
          pause_lead: opts.pauseLead ?? false,
        },
      });
      printData(validated(data, OkMessageSchema), resolveFormat(program));
    });

  // ── leads pause ───────────────────────────────────────────────────────
  // POST /campaigns/:campaign_id/leads/:lead_id/pause
  cmd
    .command("pause")
    .description("Pause a lead in a campaign")
    .requiredOption("--campaign-id <id>", "Campaign ID", parseInt)
    .requiredOption("--lead-id <id>", "Lead ID", parseInt)
    .action(async (opts) => {
      const client = makeClient(program);
      const data = await client.request<unknown>({
        method: "POST",
        path: `/campaigns/${opts.campaignId}/leads/${opts.leadId}/pause`,
      });
      printData(validated(data, OkMessageSchema), resolveFormat(program));
    });

  // ── leads resume ──────────────────────────────────────────────────────
  // POST /campaigns/:campaign_id/leads/:lead_id/resume
  cmd
    .command("resume")
    .description("Resume a paused lead in a campaign")
    .requiredOption("--campaign-id <id>", "Campaign ID", parseInt)
    .requiredOption("--lead-id <id>", "Lead ID", parseInt)
    .option("--delay-days <n>", "Resume with delay in days", parseInt)
    .action(async (opts) => {
      const client = makeClient(program);
      const data = await client.request<unknown>({
        method: "POST",
        path: `/campaigns/${opts.campaignId}/leads/${opts.leadId}/resume`,
        body: opts.delayDays !== undefined
          ? { resume_lead_with_delay_days: opts.delayDays }
          : undefined,
      });
      printData(validated(data, OkMessageSchema), resolveFormat(program));
    });

  // ── leads unsubscribe ─────────────────────────────────────────────────
  // POST /campaigns/:campaign_id/leads/:lead_id/unsubscribe
  cmd
    .command("unsubscribe")
    .description("Unsubscribe a lead from a specific campaign")
    .requiredOption("--campaign-id <id>", "Campaign ID", parseInt)
    .requiredOption("--lead-id <id>", "Lead ID", parseInt)
    .action(async (opts) => {
      const client = makeClient(program);
      const data = await client.request<unknown>({
        method: "POST",
        path: `/campaigns/${opts.campaignId}/leads/${opts.leadId}/unsubscribe`,
      });
      printData(validated(data, OkMessageSchema), resolveFormat(program));
    });

  // ── leads unsubscribe-all ─────────────────────────────────────────────
  // POST /leads/:lead_id/unsubscribe  (unsubscribe from ALL campaigns)
  cmd
    .command("unsubscribe-all")
    .description("Unsubscribe a lead from all campaigns")
    .requiredOption("--lead-id <id>", "Lead ID", parseInt)
    .action(async (opts) => {
      const client = makeClient(program);
      const data = await client.request<unknown>({
        method: "POST",
        path: `/leads/${opts.leadId}/unsubscribe`,
      });
      printData(validated(data, OkMessageSchema), resolveFormat(program));
    });

  // ── leads delete ──────────────────────────────────────────────────────
  // DELETE /campaigns/:campaign_id/leads/:lead_id
  cmd
    .command("delete")
    .description("Delete a lead from a campaign")
    .requiredOption("--campaign-id <id>", "Campaign ID", parseInt)
    .requiredOption("--lead-id <id>", "Lead ID", parseInt)
    .option("--confirm", "Confirm deletion")
    .action(async (opts) => {
      if (!opts.confirm) {
        printError(
          `Pass --confirm to delete lead ${opts.leadId} from campaign ${opts.campaignId}`,
        );
        process.exit(EXIT_ERROR);
      }
      const client = makeClient(program);
      const data = await client.request<unknown>({
        method: "DELETE",
        path: `/campaigns/${opts.campaignId}/leads/${opts.leadId}`,
      });
      printData(validated(data, OkMessageSchema), resolveFormat(program));
    });

  // ── leads deactivate ──────────────────────────────────────────────────
  // POST /leads/push-to-list  (move/copy leads to a list, deactivating them)
  cmd
    .command("deactivate")
    .description("Deactivate leads by moving them to a list")
    .requiredOption("--from-json <path>", "JSON file with listId, leadIds/allLeads, action")
    .action(async (opts) => {
      const client = makeClient(program);
      const body = loadJson(opts.fromJson);
      const data = await client.request<unknown>({
        method: "POST",
        path: "/leads/push-to-list",
        body,
      });
      printData(validated(data, OkMessageSchema), resolveFormat(program));
    });

  // ── leads deactivate-campaign ─────────────────────────────────────────
  // POST /leads/campaign/push-to-list  (push leads from campaign to list)
  cmd
    .command("deactivate-campaign")
    .description("Move leads from a campaign to a list")
    .requiredOption("--from-json <path>", "JSON file with campaignId, listId, leadMapIds/allLeads")
    .action(async (opts) => {
      const client = makeClient(program);
      const body = loadJson(opts.fromJson);
      const data = await client.request<unknown>({
        method: "POST",
        path: "/leads/campaign/push-to-list",
        body,
      });
      printData(validated(data, OkMessageSchema), resolveFormat(program));
    });

  // ── leads messages ────────────────────────────────────────────────────
  // GET /campaigns/:campaign_id/leads/:lead_id/message-history
  cmd
    .command("messages")
    .description("Get message history for a lead in a campaign")
    .requiredOption("--campaign-id <id>", "Campaign ID", parseInt)
    .requiredOption("--lead-id <id>", "Lead ID", parseInt)
    .action(async (opts) => {
      const client = makeClient(program);
      const data = await client.request<unknown>({
        path: `/campaigns/${opts.campaignId}/leads/${opts.leadId}/message-history`,
      });
      printData(validated(data, OkMessageSchema), resolveFormat(program));
    });

  // ── leads blocklist ───────────────────────────────────────────────────
  // GET /leads/get-domain-block-list
  cmd
    .command("blocklist")
    .description("List blocked domains and emails")
    .option("--limit <n>", "Max results (1-1000)", parseInt)
    .option("--offset <n>", "Skip first N results", parseInt)
    .option("--filter-email-or-domain <s>", "Filter by email or domain")
    .option("--client-id <id>", "Filter by client ID", parseInt)
    .action(async (opts) => {
      const client = makeClient(program);
      const data = await client.request<unknown>({
        path: "/leads/get-domain-block-list",
        params: {
          offset: opts.offset,
          limit: opts.limit,
          filter_email_or_domain: opts.filterEmailOrDomain,
          filter_client_id: opts.clientId,
        },
      });
      printData(validated(data, BlocklistSchema), resolveFormat(program));
    });

  // ── leads blocklist-add ───────────────────────────────────────────────
  // POST /leads/add-domain-block-list
  cmd
    .command("blocklist-add")
    .description("Add emails or domains to the block list")
    .option("--email <emails...>", "Email addresses to block")
    .option("--domain <domains...>", "Domains to block")
    .option("--client-id <id>", "Client ID", parseInt)
    .option("--from-json <path>", "JSON file with domain_block_list array")
    .action(async (opts) => {
      const client = makeClient(program);
      let body: unknown;
      if (opts.fromJson) {
        body = loadJson(opts.fromJson);
      } else {
        const entries: string[] = [
          ...(opts.email ?? []),
          ...(opts.domain ?? []),
        ];
        if (entries.length === 0) {
          printError("Provide --email, --domain, or --from-json");
          process.exit(EXIT_ERROR);
        }
        body = { domain_block_list: entries, client_id: opts.clientId };
      }
      const data = await client.request<unknown>({
        method: "POST",
        path: "/leads/add-domain-block-list",
        body,
      });
      printData(validated(data, OkMessageSchema), resolveFormat(program));
    });

  // ── leads blocklist-remove ────────────────────────────────────────────
  // DELETE /leads/delete-domain-block-list?id=...
  cmd
    .command("blocklist-remove")
    .description("Remove an entry from the block list")
    .requiredOption("--id <id>", "Block list entry ID", parseInt)
    .option("--confirm", "Confirm removal")
    .action(async (opts) => {
      if (!opts.confirm) {
        printError("Pass --confirm to remove block list entry " + opts.id);
        return;
      }
      const client = makeClient(program);
      const data = await client.request<unknown>({
        method: "DELETE",
        path: "/leads/delete-domain-block-list",
        params: { id: opts.id },
      });
      printData(validated(data, OkMessageSchema), resolveFormat(program));
    });
}
