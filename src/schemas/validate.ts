import { type ZodType, type ZodError } from "zod";

/**
 * Validate API response data against a Zod schema.
 * On success, returns the parsed (possibly transformed) data.
 * On failure, logs a warning to stderr and returns the raw data unchanged.
 * This is a safety net — it never blocks the user.
 */
export function validated<T>(data: unknown, schema: ZodType<T>): T | unknown {
  const result = schema.safeParse(data);
  if (result.success) {
    return result.data;
  }
  formatWarning(result.error);
  return data;
}

function formatWarning(error: ZodError): void {
  const issues = error.issues.slice(0, 3);
  const lines = issues.map(
    (i) => `  ${i.path.join(".")}: ${i.message}`,
  );
  if (error.issues.length > 3) {
    lines.push(`  ... and ${error.issues.length - 3} more`);
  }
  process.stderr.write(
    `Warning: API response shape changed — CLI output may be incomplete\n${lines.join("\n")}\n`,
  );
}
