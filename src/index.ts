#!/usr/bin/env node

import { Command } from "commander";
import { CliError } from "./client.js";
import { detectFormat, type OutputFormat } from "./output.js";
import { printError } from "./output.js";
import { registerConfigCommand } from "./commands/config-cmd.js";
import { registerCampaignsCommand } from "./commands/campaigns.js";
import { registerLeadsCommand } from "./commands/leads.js";
import { registerMailboxesCommand } from "./commands/mailboxes.js";
import { registerStatsCommand } from "./commands/stats.js";
import { registerDeliveryCommand } from "./commands/delivery.js";
import { registerWebhooksCommand } from "./commands/webhooks.js";
import { registerClientsCommand } from "./commands/clients.js";
import { registerSendersCommand } from "./commands/senders.js";
import { registerAnalyticsCommand } from "./commands/analytics.js";
import { registerInboxCommand } from "./commands/inbox.js";
import { registerProspectCommand } from "./commands/prospect.js";

const program = new Command();

program
  .name("smartlead")
  .description("CLI for the SmartLead email outreach platform")
  .version("0.1.0")
  .option("--api-key <key>", "SmartLead API key")
  .option("--format <format>", "Output format: json, table, csv")
  .option("--quiet", "Suppress non-essential output")
  .option("--retry", "Automatically retry on 429 rate-limit with exponential backoff");

// Register all commands
registerConfigCommand(program);
registerCampaignsCommand(program);
registerLeadsCommand(program);
registerMailboxesCommand(program);
registerStatsCommand(program);
registerDeliveryCommand(program);
registerWebhooksCommand(program);
registerClientsCommand(program);
registerSendersCommand(program);
registerAnalyticsCommand(program);
registerInboxCommand(program);
registerProspectCommand(program);

/**
 * Resolve the output format from flags or auto-detect.
 */
export function resolveFormat(opts: Record<string, unknown>): OutputFormat {
  const f = opts["format"] as string | undefined;
  if (f === "json" || f === "table" || f === "csv") return f;
  return detectFormat();
}

// Global error handler
program.exitOverride();

async function main() {
  try {
    await program.parseAsync(process.argv);
  } catch (err) {
    if (err instanceof CliError) {
      printError(err.message);
      process.exit(err.exitCode);
    }
    if (err instanceof Error) {
      // Commander throws for --help / --version with code "commander.helpDisplayed" etc.
      const cmdErr = err as Error & { code?: string };
      if (cmdErr.code === "commander.helpDisplayed" || cmdErr.code === "commander.version") {
        process.exit(0);
      }
      printError(err.message);
      process.exit(1);
    }
    process.exit(1);
  }
}

main();
