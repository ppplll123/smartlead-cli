import { readFileSync, writeFileSync, mkdirSync, chmodSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

export interface SmartLeadConfig {
  api_key?: string;
  format?: "json" | "table" | "csv";
  prospect_api_url?: string;
}

const CONFIG_DIR = join(homedir(), ".smartlead");
const CONFIG_PATH = join(CONFIG_DIR, "config.json");

/** Module-level flag so we only warn about permissions once per process. */
let permissionWarningEmitted = false;

function checkConfigPermissions(): void {
  if (permissionWarningEmitted) return;
  try {
    if (!existsSync(CONFIG_PATH)) return;
    const stat = statSync(CONFIG_PATH);
    // Check if the file is world-readable (others have read permission).
    // 0o004 = world-read bit.
    const mode = stat.mode & 0o777;
    if (mode & 0o044) {
      // File is group-readable or world-readable — not 0600
      process.stderr.write(
        "Warning: ~/.smartlead/config.json is world-readable. Run: chmod 600 ~/.smartlead/config.json\n",
      );
      permissionWarningEmitted = true;
    }
  } catch {
    // Ignore errors during permission check
  }
}

export function readConfig(): SmartLeadConfig {
  try {
    if (!existsSync(CONFIG_PATH)) return {};
    checkConfigPermissions();
    const raw = readFileSync(CONFIG_PATH, "utf-8");
    return JSON.parse(raw) as SmartLeadConfig;
  } catch {
    return {};
  }
}

export function writeConfig(config: SmartLeadConfig): void {
  mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + "\n", {
    encoding: "utf-8",
    mode: 0o600,
  });
  chmodSync(CONFIG_PATH, 0o600);
}

export function getConfigValue(key: string): string | undefined {
  const config = readConfig();
  return config[key as keyof SmartLeadConfig];
}

export function setConfigValue(key: string, value: string): void {
  const config = readConfig();
  (config as Record<string, string>)[key] = value;
  writeConfig(config);
}

export function clearConfig(): void {
  writeConfig({});
}
