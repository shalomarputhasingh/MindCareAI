/** Word count for the live counter and journal history excerpts. */
export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

/** A short, single-line preview of an entry for the history list. */
export function excerpt(text: string, maxLength = 140): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= maxLength) return flat;
  return `${flat.slice(0, maxLength).trimEnd()}…`;
}
