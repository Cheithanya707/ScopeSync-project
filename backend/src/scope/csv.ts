/** Escapes one CSV cell and neutralises spreadsheet formula injection. */
export function csvCell(value: unknown): string {
  let textValue = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(textValue)) textValue = `'${textValue}`;
  return /[",\r\n]/.test(textValue) ? `"${textValue.replaceAll('"', '""')}"` : textValue;
}

export function toCsv(rows: unknown[][]): string {
  return `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}\r\n`;
}
