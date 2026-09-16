import { extract } from "@extractus/article-extractor";
import { cleanFeedSnippet } from "@/lib/article-text";
import { pickImageFromHtml, isUsableCoverImage } from "@/lib/article-cover";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36";
const FETCH_TIMEOUT_MS = 45_000;
const MAX_CONTENT_LENGTH = 20_000;

function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function pickExcerpt(body: string, title: string): string {
  const text = body || title;
  const slice = text.slice(0, 280);
  return slice + (text.length > 280 ? "…" : "");
}

function normalizeImageUrl(url: string, pageUrl: string): string | null {
  const trimmed = url.trim();
  if (!trimmed || trimmed.startsWith("data:")) return null;
  try {
    if (trimmed.startsWith("//")) return `https:${trimmed}`;
    if (trimmed.startsWith("http")) return trimmed;
    return new URL(trimmed, pageUrl).href;
  } catch {
    return null;
  }
}

export type FetchedArticle = {
  content: string;
  excerpt: string;
  image: string | null;
};

async function fetchOgImage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "user-agent": USER_AGENT },
      signal: AbortSignal.timeout(12_000),
      redirect: "follow",
    });
    if (!res.ok) return null;
    const html = await res.text();
    const picked = pickImageFromHtml(html);
    return picked ? normalizeImageUrl(picked, url) : null;
  } catch {
    return null;
  }
}

/** Fetch cover image only (og:image / extractor). */
export async function fetchCoverImageFromUrl(url: string): Promise<string | null> {
  try {
    const data = await extract(
      url,
      {},
      {
        headers: { "user-agent": USER_AGENT },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      },
    );
    if (data?.image?.trim()) {
      return normalizeImageUrl(data.image, url);
    }
  } catch {
    /* fall through */
  }
  return fetchOgImage(url);
}
export async function fetchArticleFromUrl(url: string): Promise<FetchedArticle | null> {
  try {
    const data = await extract(
      url,
      {},
      {
        headers: { "user-agent": USER_AGENT },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      },
    );

    const raw = data?.content?.trim();
    if (!raw || !data) return null;

    const content = cleanFeedSnippet(htmlToText(raw)).slice(0, MAX_CONTENT_LENGTH);
    if (content.length < 280) return null;

    const title = data.title?.trim() ?? "";
    let image: string | null = null;
    if (data.image?.trim()) {
      image = normalizeImageUrl(data.image, url);
    }
    if (!image) {
      image = await fetchOgImage(url);
    }
    if (image && !isUsableCoverImage(image)) image = null;

    return {
      content,
      excerpt: pickExcerpt(content, title),
      image,
    };
  } catch {
    const image = await fetchOgImage(url);
    if (!image || !isUsableCoverImage(image)) return null;
    return { content: "", excerpt: "", image };
  }
}
