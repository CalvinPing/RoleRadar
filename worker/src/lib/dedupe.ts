function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/\(.*?\)/g, " ") // drop parenthetical req IDs, "(Remote)" etc
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function makeDedupeKey(
  companySlug: string,
  title: string,
  location: string,
): string {
  return `${companySlug}::${normalize(title)}::${normalize(location)}`;
}
