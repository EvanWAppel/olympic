/** Serialize a value to a single CSV field, quoting/escaping per RFC 4180. */
function field(value: unknown): string {
  if (value === null || value === undefined) return ""
  const str = value instanceof Date ? value.toISOString() : String(value)
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * Serialize an array of records to CSV. Columns are emitted in the given order
 * (independent of object key order). Returns a header-only string for no rows.
 */
export function toCsv<T extends Record<string, unknown>>(
  rows: T[],
  columns: Array<keyof T & string>,
): string {
  const header = columns.map(field).join(",")
  const body = rows.map((row) => columns.map((c) => field(row[c])).join(","))
  return [header, ...body].join("\n")
}
