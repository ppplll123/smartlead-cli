import { readFileSync } from "node:fs";
import { Command } from "commander";
import { SmartLeadClient, CliError, EXIT_ERROR } from "../client.js";
import { printData, printError, detectFormat, type OutputFormat } from "../output.js";
import { validated } from "../schemas/validate.js";
import {
  EmailAccountListSchema, EmailAccountByIdSchema, WarmupStatsSchema,
  TagMappingResponseSchema,
} from "../schemas/mailboxes.schema.js";

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

export function registerMailboxesCommand(program: Command): void {
  const cmd = program
    .command("mailboxes")
    .description("Manage email accounts");

  // ── mailboxes create ──────────────────────────────────────────────────
  // POST /email-accounts/save
  cmd
    .command("create")
    .description("Create an email account (SMTP/IMAP)")
    .requiredOption("--from-json <path>", "JSON file with account credentials")
    .action(async (opts) => {
      const client = makeClient(program);
      const body = loadJson(opts.fromJson);
      const data = await client.request<unknown>({
        method: "POST",
        path: "/email-accounts/save",
        body,
      });
      printData(validated(data, TagMappingResponseSchema), resolveFormat(program));
    });

  // ── mailboxes list ────────────────────────────────────────────────────
  // GET /email-accounts
  cmd
    .command("list")
    .description("List email accounts with filtering")
    .option("--limit <n>", "Max results (1-100)", parseInt)
    .option("--offset <n>", "Skip first N results", parseInt)
    .option("--warmup-status <s>", "Filter: ACTIVE|INACTIVE")
    .option("--esp <type>", "Filter: GMAIL|OUTLOOK|SMTP")
    .option("--in-use <bool>", "Filter by in-use status (true|false)")
    .option("--smtp-success <bool>", "Filter by SMTP success (true|false)")
    .option("--warmup-blocked <bool>", "Filter by warmup blocked (true|false)")
    .option("--username <s>", "Filter by username")
    .option("--client-id <id>", "Filter by client ID", parseInt)
    .action(async (opts) => {
      const client = makeClient(program);
      const data = await client.request<unknown>({
        path: "/email-accounts",
        params: {
          offset: opts.offset,
          limit: opts.limit,
          emailWarmupStatus: opts.warmupStatus,
          esp: opts.esp,
          isInUse: opts.inUse,
          isSmtpSuccess: opts.smtpSuccess,
          isWarmupBlocked: opts.warmupBlocked,
          username: opts.username,
          client_id: opts.clientId,
        },
      });
      printData(validated(data, EmailAccountListSchema), resolveFormat(program));
    });

  // ── mailboxes list-all ────────────────────────────────────────────────
  // GET /email-accounts (paginate through all)
  cmd
    .command("list-all")
    .description("List all email accounts (auto-paginate)")
    .option("--warmup-status <s>", "Filter: ACTIVE|INACTIVE")
    .option("--esp <type>", "Filter: GMAIL|OUTLOOK|SMTP")
    .option("--client-id <id>", "Filter by client ID", parseInt)
    .action(async (opts) => {
      const client = makeClient(program);
      const limit = 100;
      const all: unknown[] = [];
      let offset = 0;

      for (;;) {
        const page = await client.request<unknown[]>({
          path: "/email-accounts",
          params: {
            offset,
            limit,
            emailWarmupStatus: opts.warmupStatus,
            esp: opts.esp,
            client_id: opts.clientId,
          },
        });
        if (!Array.isArray(page) || page.length === 0) break;
        all.push(...page);
        if (page.length < limit) break;
        offset += page.length;
      }
      printData(validated(all, EmailAccountListSchema), resolveFormat(program));
    });

  // ── mailboxes get ─────────────────────────────────────────────────────
  // GET /email-accounts/:account_id/
  cmd
    .command("get")
    .description("Get an email account by ID")
    .requiredOption("--id <id>", "Account ID", parseInt)
    .option("--fetch-campaigns", "Include associated campaigns")
    .option("--fetch-tags", "Include tags")
    .action(async (opts) => {
      const client = makeClient(program);
      const data = await client.request<unknown>({
        path: `/email-accounts/${opts.id}/`,
        params: {
          fetch_campaigns: opts.fetchCampaigns,
          fetch_tags: opts.fetchTags,
        },
      });
      printData(validated(data, EmailAccountByIdSchema), resolveFormat(program));
    });

  // ── mailboxes list-by-campaign ────────────────────────────────────────
  // GET /campaigns/:campaign_id/email-accounts
  cmd
    .command("list-by-campaign")
    .description("List email accounts for a campaign")
    .requiredOption("--campaign-id <id>", "Campaign ID", parseInt)
    .action(async (opts) => {
      const client = makeClient(program);
      const data = await client.request<unknown>({
        path: `/campaigns/${opts.campaignId}/email-accounts`,
      });
      printData(validated(data, EmailAccountListSchema), resolveFormat(program));
    });

  // ── mailboxes add-to-campaign ─────────────────────────────────────────
  // POST /campaigns/:campaign_id/email-accounts
  cmd
    .command("add-to-campaign")
    .description("Associate email accounts with a campaign")
    .requiredOption("--campaign-id <id>", "Campaign ID", parseInt)
    .requiredOption("--account-ids <ids...>", "Email account IDs", (v, prev: number[]) => {
      prev.push(parseInt(v));
      return prev;
    }, [] as number[])
    .option("--auto-adjust-warmup", "Auto-adjust warmup settings")
    .action(async (opts) => {
      const client = makeClient(program);
      const data = await client.request<unknown>({
        method: "POST",
        path: `/campaigns/${opts.campaignId}/email-accounts`,
        body: {
          email_account_ids: opts.accountIds,
          auto_adjust_warmup: opts.autoAdjustWarmup,
        },
      });
      printData(validated(data, TagMappingResponseSchema), resolveFormat(program));
    });

  // ── mailboxes remove ──────────────────────────────────────────────────
  // DELETE /campaigns/:campaign_id/email-accounts
  cmd
    .command("remove")
    .description("Remove email accounts from a campaign")
    .requiredOption("--campaign-id <id>", "Campaign ID", parseInt)
    .requiredOption("--account-ids <ids...>", "Email account IDs", (v, prev: number[]) => {
      prev.push(parseInt(v));
      return prev;
    }, [] as number[])
    .option("--confirm", "Confirm removal")
    .action(async (opts) => {
      if (!opts.confirm) {
        printError(
          `Pass --confirm to remove email accounts from campaign ${opts.campaignId}`,
        );
        return;
      }
      const client = makeClient(program);
      const data = await client.request<unknown>({
        method: "DELETE",
        path: `/campaigns/${opts.campaignId}/email-accounts`,
        body: { email_account_ids: opts.accountIds },
      });
      printData(validated(data, TagMappingResponseSchema), resolveFormat(program));
    });

  // ── mailboxes update ──────────────────────────────────────────────────
  // POST /email-accounts/:account_id
  cmd
    .command("update")
    .description("Update email account details")
    .requiredOption("--id <id>", "Account ID", parseInt)
    .requiredOption("--from-json <path>", "JSON file with account fields to update")
    .action(async (opts) => {
      const client = makeClient(program);
      const body = loadJson(opts.fromJson);
      const data = await client.request<unknown>({
        method: "POST",
        path: `/email-accounts/${opts.id}`,
        body,
      });
      printData(validated(data, TagMappingResponseSchema), resolveFormat(program));
    });

  // ── mailboxes set-warmup ──────────────────────────────────────────────
  // POST /email-accounts/:account_id/warmup
  cmd
    .command("set-warmup")
    .description("Configure warmup settings for an email account")
    .requiredOption("--id <id>", "Account ID", parseInt)
    .requiredOption("--from-json <path>", "JSON file with warmup settings")
    .action(async (opts) => {
      const client = makeClient(program);
      const body = loadJson(opts.fromJson);
      const data = await client.request<unknown>({
        method: "POST",
        path: `/email-accounts/${opts.id}/warmup`,
        body,
      });
      printData(validated(data, TagMappingResponseSchema), resolveFormat(program));
    });

  // ── mailboxes warmup-stats ────────────────────────────────────────────
  // GET /email-accounts/:account_id/warmup-stats
  cmd
    .command("warmup-stats")
    .description("Get date-wise warmup statistics for an email account")
    .requiredOption("--id <id>", "Account ID", parseInt)
    .action(async (opts) => {
      const client = makeClient(program);
      const data = await client.request<unknown>({
        path: `/email-accounts/${opts.id}/warmup-stats`,
      });
      printData(validated(data, WarmupStatsSchema), resolveFormat(program));
    });

  // ── mailboxes reconnect ───────────────────────────────────────────────
  // POST /email-accounts/reconnect-failed-email-accounts
  cmd
    .command("reconnect")
    .description("Bulk reconnect failed email accounts")
    .option("--from-json <path>", "JSON file with reconnect body")
    .action(async (opts) => {
      const client = makeClient(program);
      const body = opts.fromJson ? loadJson(opts.fromJson) : {};
      const data = await client.request<unknown>({
        method: "POST",
        path: "/email-accounts/reconnect-failed-email-accounts",
        body,
      });
      printData(validated(data, TagMappingResponseSchema), resolveFormat(program));
    });

  // ── mailboxes update-tag ──────────────────────────────────────────────
  // POST /email-accounts/tag-manager
  cmd
    .command("update-tag")
    .description("Create or update an email account tag")
    .requiredOption("--id <id>", "Tag ID", parseInt)
    .requiredOption("--name <name>", "Tag name")
    .requiredOption("--color <hex>", "Tag color as hex (e.g. #FF5733)")
    .action(async (opts) => {
      const client = makeClient(program);
      const data = await client.request<unknown>({
        method: "POST",
        path: "/email-accounts/tag-manager",
        body: { id: opts.id, name: opts.name, color: opts.color },
      });
      printData(validated(data, TagMappingResponseSchema), resolveFormat(program));
    });

  // ── mailboxes add-tags ────────────────────────────────────────────────
  // POST /email-accounts/tag-mapping
  cmd
    .command("add-tags")
    .description("Add tags to email accounts")
    .requiredOption("--from-json <path>", "JSON file with email_account_ids and tag_ids arrays")
    .action(async (opts) => {
      const client = makeClient(program);
      const body = loadJson(opts.fromJson);
      const data = await client.request<unknown>({
        method: "POST",
        path: "/email-accounts/tag-mapping",
        body,
      });
      printData(validated(data, TagMappingResponseSchema), resolveFormat(program));
    });

  // ── mailboxes remove-tags ─────────────────────────────────────────────
  // DELETE /email-accounts/tag-mapping
  cmd
    .command("remove-tags")
    .description("Remove tags from email accounts")
    .requiredOption("--from-json <path>", "JSON file with email_account_ids and tag_ids arrays")
    .option("--confirm", "Confirm tag removal")
    .action(async (opts) => {
      if (!opts.confirm) {
        printError("Pass --confirm to remove tags from email accounts");
        return;
      }
      const client = makeClient(program);
      const body = loadJson(opts.fromJson);
      const data = await client.request<unknown>({
        method: "DELETE",
        path: "/email-accounts/tag-mapping",
        body,
      });
      printData(validated(data, TagMappingResponseSchema), resolveFormat(program));
    });

  // ── mailboxes tags-by-email ───────────────────────────────────────────
  // POST /email-accounts/tag-list
  cmd
    .command("tags-by-email")
    .description("Get account IDs, emails, and tags for given email addresses")
    .requiredOption("--from-json <path>", "JSON file with email_ids array")
    .action(async (opts) => {
      const client = makeClient(program);
      const body = loadJson(opts.fromJson);
      const data = await client.request<unknown>({
        method: "POST",
        path: "/email-accounts/tag-list",
        body,
      });
      printData(validated(data, TagMappingResponseSchema), resolveFormat(program));
    });

  // ── mailboxes fetch-messages ──────────────────────────────────────────
  // POST /email-accounts/:account_id/fetch-messages
  cmd
    .command("fetch-messages")
    .description("Fetch messages for an email account")
    .requiredOption("--id <id>", "Account ID", parseInt)
    .option("--limit <n>", "Max messages (1-500, default 100)", parseInt)
    .option("--folder <name>", "Mailbox folder to fetch from")
    .option("--include-body", "Include message body")
    .option("--from <date>", "Start date (ISO format)")
    .option("--to <date>", "End date (ISO format)")
    .action(async (opts) => {
      const client = makeClient(program);
      const data = await client.request<unknown>({
        method: "POST",
        path: `/email-accounts/${opts.id}/fetch-messages`,
        body: {
          limit: opts.limit,
          folder: opts.folder,
          includeBody: opts.includeBody,
          from: opts.from,
          to: opts.to,
        },
      });
      printData(validated(data, TagMappingResponseSchema), resolveFormat(program));
    });

  // ── mailboxes bulk-fetch-messages ─────────────────────────────────────
  // POST /email-accounts/multi/fetch-messages
  cmd
    .command("bulk-fetch-messages")
    .description("Fetch messages for multiple email accounts")
    .requiredOption("--from-json <path>", "JSON file with array of {account_id, limit, folder, ...}")
    .action(async (opts) => {
      const client = makeClient(program);
      const body = loadJson(opts.fromJson);
      const data = await client.request<unknown>({
        method: "POST",
        path: "/email-accounts/multi/fetch-messages",
        body,
      });
      printData(validated(data, TagMappingResponseSchema), resolveFormat(program));
    });
}
