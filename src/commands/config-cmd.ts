import { Command } from "commander";
import { getConfigValue, setConfigValue, clearConfig, readConfig } from "../config.js";
import { printData, printError, type OutputFormat } from "../output.js";

export function registerConfigCommand(program: Command): void {
  const config = program.command("config").description("Manage CLI configuration");

  config
    .command("set <key> <value>")
    .description("Set a configuration value")
    .action((key: string, value: string) => {
      setConfigValue(key, value);
      process.stderr.write(`Set ${key}\n`);
    });

  config
    .command("get <key>")
    .description("Get a configuration value")
    .action((key: string) => {
      const format = program.opts()["format"] as OutputFormat | undefined;
      const value = getConfigValue(key);
      if (value === undefined) {
        printError(`Key "${key}" is not set`);
        process.exit(1);
      }
      printData({ [key]: value }, format ?? "json");
    });

  config
    .command("list")
    .description("Show all configuration values")
    .action(() => {
      const format = program.opts()["format"] as OutputFormat | undefined;
      const all = readConfig();
      printData(all, format ?? "json");
    });

  config
    .command("clear")
    .description("Clear all configuration")
    .action(() => {
      clearConfig();
      process.stderr.write("Configuration cleared\n");
    });
}
