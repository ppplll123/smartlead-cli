import { Command } from "commander";

export function registerSendersCommand(program: Command): void {
  program.command("senders").description("Manage smart sender accounts");
}
