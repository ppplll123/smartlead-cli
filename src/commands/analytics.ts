import { Command } from "commander";
import { SmartLeadClient } from "../client.js";
import { printData, detectFormat, type OutputFormat } from "../output.js";
import { validated } from "../schemas/validate.js";
import { AnalyticsResponseSchema } from "../schemas/analytics.schema.js";

function resolveFormat(program: Command): OutputFormat {
  const f = program.opts()["format"] as string | undefined;
  if (f === "json" || f === "table" || f === "csv") return f;
  return detectFormat();
}

function makeClient(program: Command): SmartLeadClient {
  const opts = program.opts();
  return new SmartLeadClient(opts["apiKey"] as string | undefined, undefined, opts["retry"] as boolean | undefined);
}

/** Shared date-range + filter options used by most analytics endpoints. */
function addDateRangeOpts(c: Command): Command {
  return c
    .requiredOption("--from <date>", "Start date (YYYY-MM-DD)")
    .requiredOption("--to <date>", "End date (YYYY-MM-DD)")
    .option("--timezone <tz>", "IANA timezone")
    .option("--client-ids <ids>", "Comma-separated client IDs")
    .option("--campaign-ids <ids>", "Comma-separated campaign IDs");
}

function dateRangeParams(opts: Record<string, unknown>) {
  return {
    start_date: opts["from"] as string,
    end_date: opts["to"] as string,
    timezone: opts["timezone"] as string | undefined,
    client_ids: opts["clientIds"] as string | undefined,
    campaign_ids: opts["campaignIds"] as string | undefined,
  };
}

export function registerAnalyticsCommand(program: Command): void {
  const cmd = program
    .command("analytics")
    .description("Cross-campaign analytics and reporting");

  // ── analytics campaigns ───────────────────────────────────────────────
  // GET /analytics/campaign/list
  cmd
    .command("campaigns")
    .description("List campaigns for analytics")
    .option("--client-ids <ids>", "Comma-separated client IDs")
    .action(async (opts) => {
      const client = makeClient(program);
      const data = await client.request<unknown>({
        path: "/analytics/campaign/list",
        params: { client_ids: opts.clientIds },
      });
      printData(validated(data, AnalyticsResponseSchema), resolveFormat(program));
    });

  // ── analytics clients ─────────────────────────────────────────────────
  // GET /analytics/client/list
  cmd
    .command("clients")
    .description("List clients for analytics")
    .option("--client-ids <ids>", "Comma-separated client IDs")
    .action(async (opts) => {
      const client = makeClient(program);
      const data = await client.request<unknown>({
        path: "/analytics/client/list",
        params: { client_ids: opts.clientIds },
      });
      printData(validated(data, AnalyticsResponseSchema), resolveFormat(program));
    });

  // ── analytics client-monthly ──────────────────────────────────────────
  // GET /analytics/client/month-wise-count
  cmd
    .command("client-monthly")
    .description("Get month-wise client counts")
    .option("--client-ids <ids>", "Comma-separated client IDs")
    .action(async (opts) => {
      const client = makeClient(program);
      const data = await client.request<unknown>({
        path: "/analytics/client/month-wise-count",
        params: { client_ids: opts.clientIds },
      });
      printData(validated(data, AnalyticsResponseSchema), resolveFormat(program));
    });

  // ── analytics overall ─────────────────────────────────────────────────
  // GET /analytics/overall-stats-v2
  {
    const c = cmd
      .command("overall")
      .description("Get overall stats across all campaigns");
    addDateRangeOpts(c)
      .option("--full-data <bool>", "Return full data set")
      .action(async (opts) => {
        const client = makeClient(program);
        const data = await client.request<unknown>({
          path: "/analytics/overall-stats-v2",
          params: { ...dateRangeParams(opts), full_data: opts.fullData },
        });
        printData(validated(data, AnalyticsResponseSchema), resolveFormat(program));
      });
  }

  // ── analytics daily ───────────────────────────────────────────────────
  // GET /analytics/day-wise-overall-stats
  {
    const c = cmd
      .command("daily")
      .description("Get day-wise overall stats");
    addDateRangeOpts(c).action(async (opts) => {
      const client = makeClient(program);
      const data = await client.request<unknown>({
        path: "/analytics/day-wise-overall-stats",
        params: dateRangeParams(opts),
      });
      printData(validated(data, AnalyticsResponseSchema), resolveFormat(program));
    });
  }

  // ── analytics daily-sent ──────────────────────────────────────────────
  // GET /analytics/day-wise-overall-stats-by-sent-time
  cmd
    .command("daily-sent")
    .description("Get day-wise stats grouped by sent time")
    .requiredOption("--from <date>", "Start date (YYYY-MM-DD)")
    .requiredOption("--to <date>", "End date (YYYY-MM-DD)")
    .requiredOption("--timezone <tz>", "IANA timezone (required)")
    .option("--client-ids <ids>", "Comma-separated client IDs")
    .option("--campaign-ids <ids>", "Comma-separated campaign IDs")
    .action(async (opts) => {
      const client = makeClient(program);
      const data = await client.request<unknown>({
        path: "/analytics/day-wise-overall-stats-by-sent-time",
        params: dateRangeParams(opts),
      });
      printData(validated(data, AnalyticsResponseSchema), resolveFormat(program));
    });

  // ── analytics daily-replies ───────────────────────────────────────────
  // GET /analytics/day-wise-positive-reply-stats
  {
    const c = cmd
      .command("daily-replies")
      .description("Get day-wise positive reply stats");
    addDateRangeOpts(c).action(async (opts) => {
      const client = makeClient(program);
      const data = await client.request<unknown>({
        path: "/analytics/day-wise-positive-reply-stats",
        params: dateRangeParams(opts),
      });
      printData(validated(data, AnalyticsResponseSchema), resolveFormat(program));
    });
  }

  // ── analytics daily-replies-sent ──────────────────────────────────────
  // GET /analytics/day-wise-positive-reply-stats-by-sent-time
  cmd
    .command("daily-replies-sent")
      .description("Get day-wise positive reply stats by sent time")
      .requiredOption("--from <date>", "Start date (YYYY-MM-DD)")
      .requiredOption("--to <date>", "End date (YYYY-MM-DD)")
      .requiredOption("--timezone <tz>", "IANA timezone (required)")
      .option("--client-ids <ids>", "Comma-separated client IDs")
      .option("--campaign-ids <ids>", "Comma-separated campaign IDs")
      .action(async (opts) => {
        const client = makeClient(program);
        const data = await client.request<unknown>({
          path: "/analytics/day-wise-positive-reply-stats-by-sent-time",
          params: dateRangeParams(opts),
        });
        printData(validated(data, AnalyticsResponseSchema), resolveFormat(program));
      });

  // ── analytics campaign-stats ──────────────────────────────────────────
  // GET /analytics/campaign/overall-stats
  {
    const c = cmd
      .command("campaign-stats")
      .description("Get campaign-wise performance stats");
    addDateRangeOpts(c)
      .option("--full-data <bool>", "Return full data set")
      .option("--limit <n>", "Max results")
      .option("--offset <n>", "Skip first N results")
      .action(async (opts) => {
        const client = makeClient(program);
        const data = await client.request<unknown>({
          path: "/analytics/campaign/overall-stats",
          params: {
            ...dateRangeParams(opts),
            full_data: opts.fullData,
            limit: opts.limit,
            offset: opts.offset,
          },
        });
        printData(validated(data, AnalyticsResponseSchema), resolveFormat(program));
      });
  }

  // ── analytics client-stats ────────────────────────────────────────────
  // GET /analytics/client/overall-stats
  {
    const c = cmd
      .command("client-stats")
      .description("Get client-wise performance stats");
    addDateRangeOpts(c)
      .option("--filter <f>", "Filter string")
      .option("--full-data <bool>", "Return full data set")
      .option("--limit <n>", "Max results")
      .option("--offset <n>", "Skip first N results")
      .action(async (opts) => {
        const client = makeClient(program);
        const data = await client.request<unknown>({
          path: "/analytics/client/overall-stats",
          params: {
            ...dateRangeParams(opts),
            filter: opts.filter,
            full_data: opts.fullData,
            limit: opts.limit,
            offset: opts.offset,
          },
        });
        printData(validated(data, AnalyticsResponseSchema), resolveFormat(program));
      });
  }

  // ── analytics mailbox-health ──────────────────────────────────────────
  // GET /analytics/mailbox/name-wise-health-metrics
  {
    const c = cmd
      .command("mailbox-health")
      .description("Get mailbox name-wise health metrics");
    addDateRangeOpts(c)
      .option("--full-data <bool>", "Return full data set")
      .option("--limit <n>", "Max results")
      .option("--offset <n>", "Skip first N results")
      .option("--is-bounced <bool>", "Filter by bounce status (true|false)")
      .action(async (opts) => {
        const client = makeClient(program);
        const data = await client.request<unknown>({
          path: "/analytics/mailbox/name-wise-health-metrics",
          params: {
            ...dateRangeParams(opts),
            full_data: opts.fullData,
            limit: opts.limit,
            offset: opts.offset,
            is_bounced: opts.isBounced,
          },
        });
        printData(validated(data, AnalyticsResponseSchema), resolveFormat(program));
      });
  }

  // ── analytics domain-health ───────────────────────────────────────────
  // GET /analytics/mailbox/domain-wise-health-metrics
  {
    const c = cmd
      .command("domain-health")
      .description("Get domain-wise health metrics");
    addDateRangeOpts(c)
      .option("--full-data <bool>", "Return full data set")
      .option("--limit <n>", "Max results")
      .option("--offset <n>", "Skip first N results")
      .action(async (opts) => {
        const client = makeClient(program);
        const data = await client.request<unknown>({
          path: "/analytics/mailbox/domain-wise-health-metrics",
          params: {
            ...dateRangeParams(opts),
            full_data: opts.fullData,
            limit: opts.limit,
            offset: opts.offset,
          },
        });
        printData(validated(data, AnalyticsResponseSchema), resolveFormat(program));
      });
  }

  // ── analytics provider-perf ───────────────────────────────────────────
  // GET /analytics/mailbox/provider-wise-overall-performance
  {
    const c = cmd
      .command("provider-perf")
      .description("Get provider-wise overall performance");
    addDateRangeOpts(c)
      .option("--full-data <bool>", "Return full data set")
      .action(async (opts) => {
        const client = makeClient(program);
        const data = await client.request<unknown>({
          path: "/analytics/mailbox/provider-wise-overall-performance",
          params: { ...dateRangeParams(opts), full_data: opts.fullData },
        });
        printData(validated(data, AnalyticsResponseSchema), resolveFormat(program));
      });
  }

  // ── analytics team-board ──────────────────────────────────────────────
  // GET /analytics/team-board/overall-stats
  {
    const c = cmd
      .command("team-board")
      .description("Get team board overall stats");
    addDateRangeOpts(c)
      .option("--full-data <bool>", "Return full data set")
      .action(async (opts) => {
        const client = makeClient(program);
        const data = await client.request<unknown>({
          path: "/analytics/team-board/overall-stats",
          params: { ...dateRangeParams(opts), full_data: opts.fullData },
        });
        printData(validated(data, AnalyticsResponseSchema), resolveFormat(program));
      });
  }

  // ── analytics lead-stats ──────────────────────────────────────────────
  // GET /analytics/lead/overall-stats
  {
    const c = cmd
      .command("lead-stats")
      .description("Get overall lead stats");
    addDateRangeOpts(c).action(async (opts) => {
      const client = makeClient(program);
      const data = await client.request<unknown>({
        path: "/analytics/lead/overall-stats",
        params: dateRangeParams(opts),
      });
      printData(validated(data, AnalyticsResponseSchema), resolveFormat(program));
    });
  }

  // ── analytics lead-categories ─────────────────────────────────────────
  // GET /analytics/lead/category-wise-response
  {
    const c = cmd
      .command("lead-categories")
      .description("Get lead responses grouped by category");
    addDateRangeOpts(c).action(async (opts) => {
      const client = makeClient(program);
      const data = await client.request<unknown>({
        path: "/analytics/lead/category-wise-response",
        params: dateRangeParams(opts),
      });
      printData(validated(data, AnalyticsResponseSchema), resolveFormat(program));
    });
  }

  // ── analytics first-reply ─────────────────────────────────────────────
  // GET /analytics/campaign/leads-take-for-first-reply
  {
    const c = cmd
      .command("first-reply")
      .description("Average leads reached before first reply")
    addDateRangeOpts(c).action(async (opts) => {
      const client = makeClient(program);
      const data = await client.request<unknown>({
        path: "/analytics/campaign/leads-take-for-first-reply",
        params: dateRangeParams(opts),
      });
      printData(validated(data, AnalyticsResponseSchema), resolveFormat(program));
    });
  }

  // ── analytics followup-rate ───────────────────────────────────────────
  // GET /analytics/campaign/follow-up-reply-rate
  {
    const c = cmd
      .command("followup-rate")
      .description("Get follow-up reply rate details");
    addDateRangeOpts(c).action(async (opts) => {
      const client = makeClient(program);
      const data = await client.request<unknown>({
        path: "/analytics/campaign/follow-up-reply-rate",
        params: dateRangeParams(opts),
      });
      printData(validated(data, AnalyticsResponseSchema), resolveFormat(program));
    });
  }

  // ── analytics reply-time ──────────────────────────────────────────────
  // GET /analytics/campaign/lead-to-reply-time
  {
    const c = cmd
      .command("reply-time")
      .description("Get lead-to-reply time details");
    addDateRangeOpts(c).action(async (opts) => {
      const client = makeClient(program);
      const data = await client.request<unknown>({
        path: "/analytics/campaign/lead-to-reply-time",
        params: dateRangeParams(opts),
      });
      printData(validated(data, AnalyticsResponseSchema), resolveFormat(program));
    });
  }

  // ── analytics campaign-responses ──────────────────────────────────────
  // GET /analytics/campaign/response-stats
  {
    const c = cmd
      .command("campaign-responses")
      .description("Get campaign-wise response stats");
    addDateRangeOpts(c)
      .option("--full-data <bool>", "Return full data set")
      .action(async (opts) => {
        const client = makeClient(program);
        const data = await client.request<unknown>({
          path: "/analytics/campaign/response-stats",
          params: { ...dateRangeParams(opts), full_data: opts.fullData },
        });
        printData(validated(data, AnalyticsResponseSchema), resolveFormat(program));
      });
  }

  // ── analytics campaign-status ─────────────────────────────────────────
  // GET /analytics/campaign/status-stats
  cmd
    .command("campaign-status")
    .description("Get campaign status counts")
    .option("--client-ids <ids>", "Comma-separated client IDs")
    .action(async (opts) => {
      const client = makeClient(program);
      const data = await client.request<unknown>({
        path: "/analytics/campaign/status-stats",
        params: { client_ids: opts.clientIds },
      });
      printData(validated(data, AnalyticsResponseSchema), resolveFormat(program));
    });

  // ── analytics mailbox-stats ───────────────────────────────────────────
  // GET /analytics/mailbox/overall-stats
  cmd
    .command("mailbox-stats")
    .description("Get overall mailbox stats")
    .option("--client-ids <ids>", "Comma-separated client IDs")
    .action(async (opts) => {
      const client = makeClient(program);
      const data = await client.request<unknown>({
        path: "/analytics/mailbox/overall-stats",
        params: { client_ids: opts.clientIds },
      });
      printData(validated(data, AnalyticsResponseSchema), resolveFormat(program));
    });
}
