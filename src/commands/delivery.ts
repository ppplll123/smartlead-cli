import { Command } from "commander";

export function registerDeliveryCommand(program: Command): void {
  program.command("delivery").description("Deliverability testing and diagnostics");
}
