export function cleanFeedSnippet(text: string): string {
  return decodeHtmlEntities(text)
    .replace(/\s*\[\.\.\.\]\s*/g, " ")
    .replace(/\s*…\s*$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function normalizeCompare(text: string): string {
  return cleanFeedSnippet(text).toLowerCase();
}

/** RSS imports often store the same snippet in excerpt and content. */
export function isRssSummaryOnly(excerpt: string, content: string, sourceUrl?: string | null): boolean {
  if (!sourceUrl) return false;
  const a = normalizeCompare(excerpt);
  const b = normalizeCompare(content);
  if (!b) return true;
  if (a === b) return true;
  if (b.length < 420 && (b.startsWith(a.slice(0, 80)) || a.startsWith(b.slice(0, 80)))) return true;
  return false;
}
