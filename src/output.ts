import Table from "cli-table3";

export type OutputFormat = "json" | "table" | "csv";

/**
 * Detect the best default output format.
 * JSON when stdout is piped, table when interactive.
 */
export function detectFormat(): OutputFormat {
  return process.stdout.isTTY ? "table" : "json";
}

export function formatOutput(
  data: unknown,
  format: OutputFormat,
): string {
  if (format === "json") {
    return JSON.stringify(data, null, 2);
  }

  const rows = Array.isArray(data) ? data : [data];
  if (rows.length === 0) return "";

  // Extract column keys from first row
  const keys = Object.keys(rows[0] as Record<string, unknown>);

  if (format === "csv") {
    return formatCsv(rows as Record<string, unknown>[], keys);
  }

  return formatTable(rows as Record<string, unknown>[], keys);
}

function formatCsv(rows: Record<string, unknown>[], keys: string[]): string {
  const escape = (val: unknown): string => {
    const s = val === null || val === undefined ? "" : String(val);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const lines = [keys.join(",")];
  for (const row of rows) {
    lines.push(keys.map((k) => escape(row[k])).join(","));
  }
  return lines.join("\n");
}

function formatTable(rows: Record<string, unknown>[], keys: string[]): string {
  const table = new Table({ head: keys });
  for (const row of rows) {
    table.push(keys.map((k) => {
      const v = row[k];
      return v === null || v === undefined ? "" : String(v);
    }));
  }
  return table.toString();
}

/**
 * Write data to stdout.
 */
export function printData(data: unknown, format: OutputFormat): void {
  process.stdout.write(formatOutput(data, format) + "\n");
}

/**
 * Write error to stderr.
 */
export function printError(message: string): void {
  process.stderr.write(`Error: ${message}\n`);
}
