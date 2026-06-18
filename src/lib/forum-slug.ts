export function slugifyForum(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u0400-\u04ff]+/gi, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export async function uniqueTopicSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  let slug = slugifyForum(base);
  if (!slug) slug = "topic";
  let candidate = slug;
  let n = 1;
  while (await exists(candidate)) {
    candidate = `${slug}-${n}`;
    n += 1;
  }
  return candidate;
}
