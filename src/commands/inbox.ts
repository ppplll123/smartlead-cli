import { readFileSync } from "node:fs";
import { Command } from "commander";
import { SmartLeadClient, CliError, EXIT_ERROR } from "../client.js";
import { printData, detectFormat, type OutputFormat } from "../output.js";
import { validated } from "../schemas/validate.js";
import { InboxViewResponseSchema, UntrackedRepliesSchema, OkMessageSchema, OkDataSchema } from "../schemas/inbox.schema.js";

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
 * Helper: register a POST inbox-view subcommand.
 * All view endpoints (replies, unread, snoozed, important, scheduled,
 * reminders, archived) share the same body schema.
 */
function addViewCommand(
  parent: Command,
  program: Command,
  name: string,
  description: string,
  apiPath: string,
): void {
  parent
    .command(name)
    .description(description)
    .option("--from-json <path>", "JSON file with offset, limit, filters, sortBy")
    .option("--limit <n>", "Max results (1-20)", parseInt)
    .option("--offset <n>", "Skip first N results", parseInt)
    .action(async (opts) => {
      const client = makeClient(program);
      let body: unknown;
      if (opts.fromJson) {
        body = loadJson(opts.fromJson);
      } else {
        body = {
          offset: opts.offset ?? 0,
          limit: opts.limit ?? 20,
        };
      }
      const data = await client.request<unknown>({
        method: "POST",
        path: apiPath,
        body,
      });
      printData(validated(data, InboxViewResponseSchema), resolveFormat(program));
    });
}

export function registerInboxCommand(program: Command): void {
  const cmd = program.command("inbox").description("Manage unified inbox");

  // ═══════════════════════════════════════════════════════════════════════
  //  Inbox views (all POST with filters body)
  // ═══════════════════════════════════════════════════════════════════════

  // ── inbox replies ─────────────────────────────────────────────────────
  // POST /master-inbox/inbox-replies
  addViewCommand(cmd, program, "replies", "Fetch inbox replies", "/master-inbox/inbox-replies");

  // ── inbox unread ──────────────────────────────────────────────────────
  // POST /master-inbox/unread-replies
  addViewCommand(cmd, program, "unread", "Fetch unread replies", "/master-inbox/unread-replies");

  // ── inbox snoozed ─────────────────────────────────────────────────────
  // POST /master-inbox/snoozed
  addViewCommand(cmd, program, "snoozed", "Fetch snoozed emails", "/master-inbox/snoozed");

  // ── inbox important ───────────────────────────────────────────────────
  // POST /master-inbox/important
  addViewCommand(cmd, program, "important", "Fetch important emails", "/master-inbox/important");

  // ── inbox scheduled ───────────────────────────────────────────────────
  // POST /master-inbox/scheduled
  addViewCommand(cmd, program, "scheduled", "Fetch scheduled emails", "/master-inbox/scheduled");

  // ── inbox reminders ───────────────────────────────────────────────────
  // POST /master-inbox/reminders
  addViewCommand(cmd, program, "reminders", "Fetch reminder emails", "/master-inbox/reminders");

  // ── inbox archived ────────────────────────────────────────────────────
  // POST /master-inbox/archived
  addViewCommand(cmd, program, "archived", "Fetch archived emails", "/master-inbox/archived");

  // ═══════════════════════════════════════════════════════════════════════
  //  Single-item lookups
  // ═══════════════════════════════════════════════════════════════════════

  // ── inbox lead ────────────────────────────────────────────────────────
  // GET /master-inbox/:id
  cmd
    .command("lead")
    .description("Get inbox entry by ID")
    .requiredOption("--id <id>", "Master inbox ID", parseInt)
    .action(async (opts) => {
      const client = makeClient(program);
      const data = await client.request<unknown>({
        path: `/master-inbox/${opts.id}`,
      });
      printData(validated(data, OkDataSchema), resolveFormat(program));
    });

  // ── inbox untracked ───────────────────────────────────────────────────
  // GET /master-inbox/untracked-replies
  cmd
    .command("untracked")
    .description("Fetch untracked replies")
    .option("--limit <n>", "Max results (1-100, default 20)", parseInt)
    .option("--offset <n>", "Skip first N results", parseInt)
    .option("--fetch-body", "Include email body")
    .option("--fetch-attachments", "Include attachments")
    .option("--from-email <email>", "Filter by sender email")
    .option("--to-email <email>", "Filter by recipient email")
    .option("--subject-line <s>", "Filter by subject")
    .action(async (opts) => {
      const client = makeClient(program);
      const data = await client.request<unknown>({
        path: "/master-inbox/untracked-replies",
        params: {
          limit: opts.limit,
          offset: opts.offset,
          fetchBody: opts.fetchBody,
          fetchAttachments: opts.fetchAttachments,
          from_email: opts.fromEmail,
          to_email: opts.toEmail,
          subject_line: opts.subjectLine,
        },
      });
      printData(validated(data, UntrackedRepliesSchema), resolveFormat(program));
    });

  // ═══════════════════════════════════════════════════════════════════════
  //  Email actions (reply, forward)
  // ═══════════════════════════════════════════════════════════════════════

  // ── inbox reply ───────────────────────────────────────────────────────
  // POST /campaigns/:campaign_id/reply-email-thread
  cmd
    .command("reply")
    .description("Reply to an email thread")
    .requiredOption("--from-json <path>", "JSON file with campaign_id, email_stats_id, email_body, etc.")
    .action(async (opts) => {
      const client = makeClient(program);
      const raw = loadJson(opts.fromJson) as Record<string, unknown>;
      const campaignId = raw["campaign_id"];
      if (!campaignId) {
        throw new CliError("JSON must include campaign_id", EXIT_ERROR);
      }
      const { campaign_id: _, ...body } = raw;
      const data = await client.request<unknown>({
        method: "POST",
        path: `/campaigns/${campaignId}/reply-email-thread`,
        body,
      });
      printData(validated(data, OkMessageSchema), resolveFormat(program));
    });

  // ── inbox forward ─────────────────────────────────────────────────────
  // POST /campaigns/:campaign_id/forward-email
  cmd
    .command("forward")
    .description("Forward an email")
    .requiredOption("--from-json <path>", "JSON file with campaign_id, message_id, stats_id, to_emails")
    .action(async (opts) => {
      const client = makeClient(program);
      const raw = loadJson(opts.fromJson) as Record<string, unknown>;
      const campaignId = raw["campaign_id"];
      if (!campaignId) {
        throw new CliError("JSON must include campaign_id", EXIT_ERROR);
      }
      const { campaign_id: _, ...body } = raw;
      const data = await client.request<unknown>({
        method: "POST",
        path: `/campaigns/${campaignId}/forward-email`,
        body,
      });
      printData(validated(data, OkMessageSchema), resolveFormat(program));
    });

  // ═══════════════════════════════════════════════════════════════════════
  //  Lead management actions
  // ═══════════════════════════════════════════════════════════════════════

  // ── inbox update-revenue ──────────────────────────────────────────────
  // PATCH /master-inbox/update-revenue
  cmd
    .command("update-revenue")
    .description("Update lead revenue")
    .requiredOption("--lead-id <id>", "Email lead map ID", parseInt)
    .requiredOption("--revenue <n>", "Revenue amount", parseFloat)
    .action(async (opts) => {
      const client = makeClient(program);
      const data = await client.request<unknown>({
        method: "PATCH",
        path: "/master-inbox/update-revenue",
        body: {
          email_lead_map_id: opts.leadId,
          revenue: opts.revenue,
        },
      });
      printData(validated(data, OkMessageSchema), resolveFormat(program));
    });

  // ── inbox update-category ─────────────────────────────────────────────
  // PATCH /master-inbox/update-category
  cmd
    .command("update-category")
    .description("Update lead category")
    .requiredOption("--lead-id <id>", "Email lead map ID", parseInt)
    .requiredOption("--category-id <id>", "Category ID (null to clear)", (v) =>
      v === "null" ? null : parseInt(v),
    )
    .action(async (opts) => {
      const client = makeClient(program);
      const data = await client.request<unknown>({
        method: "PATCH",
        path: "/master-inbox/update-category",
        body: {
          email_lead_map_id: opts.leadId,
          category_id: opts.categoryId,
        },
      });
      printData(validated(data, OkMessageSchema), resolveFormat(program));
    });

  // ── inbox create-task ─────────────────────────────────────────────────
  // POST /master-inbox/create-task
  cmd
    .command("create-task")
    .description("Create a task for a lead")
    .requiredOption("--from-json <path>", "JSON file with email_lead_map_id, name, description, priority, due_date")
    .action(async (opts) => {
      const client = makeClient(program);
      const body = loadJson(opts.fromJson);
      const data = await client.request<unknown>({
        method: "POST",
        path: "/master-inbox/create-task",
        body,
      });
      printData(validated(data, OkMessageSchema), resolveFormat(program));
    });

  // ── inbox create-note ─────────────────────────────────────────────────
  // POST /master-inbox/create-note
  cmd
    .command("create-note")
    .description("Create a note for a lead")
    .requiredOption("--from-json <path>", "JSON file with email_lead_map_id, note_message")
    .action(async (opts) => {
      const client = makeClient(program);
      const body = loadJson(opts.fromJson);
      const data = await client.request<unknown>({
        method: "POST",
        path: "/master-inbox/create-note",
        body,
      });
      printData(validated(data, OkMessageSchema), resolveFormat(program));
    });

  // ── inbox block-domains ───────────────────────────────────────────────
  // POST /master-inbox/block-domains
  cmd
    .command("block-domains")
    .description("Block domains from inbox")
    .requiredOption("--from-json <path>", "JSON file with domains array and optional source")
    .action(async (opts) => {
      const client = makeClient(program);
      const body = loadJson(opts.fromJson);
      const data = await client.request<unknown>({
        method: "POST",
        path: "/master-inbox/block-domains",
        body,
      });
      printData(validated(data, OkMessageSchema), resolveFormat(program));
    });

  // ── inbox resume-lead ─────────────────────────────────────────────────
  // PATCH /master-inbox/resume-lead
  cmd
    .command("resume-lead")
    .description("Resume a paused lead")
    .requiredOption("--lead-id <id>", "Email lead map ID", parseInt)
    .requiredOption("--campaign-id <id>", "Campaign ID", parseInt)
    .option("--delay-days <n>", "Resume delay in days", parseInt)
    .action(async (opts) => {
      const client = makeClient(program);
      const data = await client.request<unknown>({
        method: "PATCH",
        path: "/master-inbox/resume-lead",
        body: {
          email_lead_map_id: opts.leadId,
          campaign_id: opts.campaignId,
          resume_delay_days: opts.delayDays,
        },
      });
      printData(validated(data, OkMessageSchema), resolveFormat(program));
    });

  // ── inbox read-status ─────────────────────────────────────────────────
  // PATCH /master-inbox/change-read-status
  cmd
    .command("read-status")
    .description("Change read/unread status for a lead")
    .requiredOption("--lead-id <id>", "Email lead map ID", parseInt)
    .requiredOption("--read <bool>", "true=read, false=unread", (v) => v === "true")
    .action(async (opts) => {
      const client = makeClient(program);
      const data = await client.request<unknown>({
        method: "PATCH",
        path: "/master-inbox/change-read-status",
        body: {
          email_lead_map_id: opts.leadId,
          read_status: opts.read,
        },
      });
      printData(validated(data, OkMessageSchema), resolveFormat(program));
    });

  // ── inbox set-reminder ────────────────────────────────────────────────
  // POST /master-inbox/set-reminder
  cmd
    .command("set-reminder")
    .description("Set a reminder for a lead")
    .requiredOption("--from-json <path>", "JSON file with email_lead_map_id, email_stats_id, message, reminder_time")
    .action(async (opts) => {
      const client = makeClient(program);
      const body = loadJson(opts.fromJson);
      const data = await client.request<unknown>({
        method: "POST",
        path: "/master-inbox/set-reminder",
        body,
      });
      printData(validated(data, OkMessageSchema), resolveFormat(program));
    });

  // ── inbox push-subsequence ────────────────────────────────────────────
  // POST /master-inbox/push-to-subsequence
  cmd
    .command("push-subsequence")
    .description("Push a lead to a subsequence")
    .requiredOption("--from-json <path>", "JSON file with email_lead_map_id, sub_sequence_id, etc.")
    .action(async (opts) => {
      const client = makeClient(program);
      const body = loadJson(opts.fromJson);
      const data = await client.request<unknown>({
        method: "POST",
        path: "/master-inbox/push-to-subsequence",
        body,
      });
      printData(validated(data, OkMessageSchema), resolveFormat(program));
    });

  // ── inbox assign-member ───────────────────────────────────────────────
  // POST /master-inbox/update-team-member
  cmd
    .command("assign-member")
    .description("Assign a team member to a lead")
    .requiredOption("--from-json <path>", "JSON file with email_lead_map_id, team_member_id")
    .action(async (opts) => {
      const client = makeClient(program);
      const body = loadJson(opts.fromJson);
      const data = await client.request<unknown>({
        method: "POST",
        path: "/master-inbox/update-team-member",
        body,
      });
      printData(validated(data, OkMessageSchema), resolveFormat(program));
    });
}
