import { Command } from "commander";
import { SmartLeadClient } from "../client.js";
import { printData, detectFormat, type OutputFormat } from "../output.js";
import { validated } from "../schemas/validate.js";
import {
  CampaignAnalyticsSchema, AnalyticsByDateSchema, OverallStatsSchema,
  DayWiseStatsSchema, LeadsStatisticsSchema, MailboxStatisticsSchema,
} from "../schemas/stats.schema.js";

function resolveFormat(program: Command): OutputFormat {
  const f = program.opts()["format"] as string | undefined;
  if (f === "json" || f === "table" || f === "csv") return f;
  return detectFormat();
}

function makeClient(program: Command): SmartLeadClient {
  const opts = program.opts();
  return new SmartLeadClient(opts["apiKey"] as string | undefined, undefined, opts["retry"] as boolean | undefined);
}

export function registerStatsCommand(program: Command): void {
  const cmd = program.command("stats").description("View campaign and account statistics");

  // ── stats campaign ────────────────────────────────────────────────────
  // GET /campaigns/:campaign_id/analytics
  cmd
    .command("campaign")
    .description("Get analytics for a campaign")
    .requiredOption("--id <id>", "Campaign ID", parseInt)
    .action(async (opts) => {
      const client = makeClient(program);
      const data = await client.request<unknown>({
        path: `/campaigns/${opts.id}/analytics`,
      });
      printData(validated(data, CampaignAnalyticsSchema), resolveFormat(program));
    });

  // ── stats campaign-range ──────────────────────────────────────────────
  // GET /campaigns/:campaign_id/analytics-by-date
  cmd
    .command("campaign-range")
    .description("Get campaign analytics for a date range")
    .requiredOption("--id <id>", "Campaign ID", parseInt)
    .requiredOption("--from <date>", "Start date (YYYY-MM-DD)")
    .requiredOption("--to <date>", "End date (YYYY-MM-DD)")
    .option("--time-zone <tz>", "IANA timezone (default: UTC)")
    .action(async (opts) => {
      const client = makeClient(program);
      const data = await client.request<unknown>({
        path: `/campaigns/${opts.id}/analytics-by-date`,
        params: {
          start_date: opts.from,
          end_date: opts.to,
          time_zone: opts.timeZone,
        },
      });
      printData(validated(data, AnalyticsByDateSchema), resolveFormat(program));
    });

  // ── stats top-level ───────────────────────────────────────────────────
  // GET /analytics/overall-stats-v2
  cmd
    .command("top-level")
    .description("Get top-level analytics across all campaigns")
    .requiredOption("--from <date>", "Start date (YYYY-MM-DD)")
    .requiredOption("--to <date>", "End date (YYYY-MM-DD)")
    .option("--timezone <tz>", "IANA timezone")
    .option("--client-ids <ids>", "Comma-separated client IDs")
    .option("--campaign-ids <ids>", "Comma-separated campaign IDs")
    .action(async (opts) => {
      const client = makeClient(program);
      const data = await client.request<unknown>({
        path: "/analytics/overall-stats-v2",
        params: {
          start_date: opts.from,
          end_date: opts.to,
          timezone: opts.timezone,
          client_ids: opts.clientIds,
          campaign_ids: opts.campaignIds,
        },
      });
      printData(validated(data, OverallStatsSchema), resolveFormat(program));
    });

  // ── stats top-level-range ─────────────────────────────────────────────
  // GET /analytics/day-wise-overall-stats
  cmd
    .command("top-level-range")
    .description("Get day-wise overall stats for a date range")
    .requiredOption("--from <date>", "Start date (YYYY-MM-DD)")
    .requiredOption("--to <date>", "End date (YYYY-MM-DD)")
    .option("--timezone <tz>", "IANA timezone")
    .option("--client-ids <ids>", "Comma-separated client IDs")
    .option("--campaign-ids <ids>", "Comma-separated campaign IDs")
    .action(async (opts) => {
      const client = makeClient(program);
      const data = await client.request<unknown>({
        path: "/analytics/day-wise-overall-stats",
        params: {
          start_date: opts.from,
          end_date: opts.to,
          timezone: opts.timezone,
          client_ids: opts.clientIds,
          campaign_ids: opts.campaignIds,
        },
      });
      printData(validated(data, DayWiseStatsSchema), resolveFormat(program));
    });

  // ── stats leads ───────────────────────────────────────────────────────
  // GET /campaigns/:campaign_id/leads-statistics
  cmd
    .command("leads")
    .description("Get lead-level statistics for a campaign")
    .requiredOption("--id <id>", "Campaign ID", parseInt)
    .option("--limit <n>", "Max results (1-100)", parseInt)
    .option("--offset <n>", "Skip first N results", parseInt)
    .option("--event-time-gt <date>", "Only events after this timestamp")
    .action(async (opts) => {
      const client = makeClient(program);
      const data = await client.request<unknown>({
        path: `/campaigns/${opts.id}/leads-statistics`,
        params: {
          limit: opts.limit,
          offset: opts.offset,
          event_time_gt: opts.eventTimeGt,
        },
      });
      printData(validated(data, LeadsStatisticsSchema), resolveFormat(program));
    });

  // ── stats mailboxes ───────────────────────────────────────────────────
  // GET /campaigns/:campaign_id/mailbox-statistics
  cmd
    .command("mailboxes")
    .description("Get mailbox-level statistics for a campaign")
    .requiredOption("--id <id>", "Campaign ID", parseInt)
    .option("--limit <n>", "Max results (1-20)", parseInt)
    .option("--offset <n>", "Skip first N results", parseInt)
    .option("--start-date <date>", "Start date filter")
    .option("--end-date <date>", "End date filter")
    .option("--time-zone <tz>", "IANA timezone")
    .option("--client-id <id>", "Client ID filter", parseInt)
    .action(async (opts) => {
      const client = makeClient(program);
      const data = await client.request<unknown>({
        path: `/campaigns/${opts.id}/mailbox-statistics`,
        params: {
          limit: opts.limit,
          offset: opts.offset,
          start_date: opts.startDate,
          end_date: opts.endDate,
          time_zone: opts.timeZone,
          client_id: opts.clientId,
        },
      });
      printData(validated(data, MailboxStatisticsSchema), resolveFormat(program));
    });
}
