import type { Category } from "@prisma/client";

const CATEGORY_FALLBACKS: Record<Category, string> = {
  SCAMS: "/covers/scam-01.svg",
  BREAKING_BREACH: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1200&q=80&auto=format&fit=crop",
  RANSOMWARE: "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=1200&q=80&auto=format&fit=crop",
  DARKNET: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&q=80&auto=format&fit=crop",
  THREAT_INTEL: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80&auto=format&fit=crop",
  ZERO_DAY: "https://images.unsplash.com/photo-1633265486064-086b219458ec?w=1200&q=80&auto=format&fit=crop",
  DATA_LEAK: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&q=80&auto=format&fit=crop",
  APT: "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=1200&q=80&auto=format&fit=crop",
  CYBER_DEFENSE: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&q=80&auto=format&fit=crop",
};

const BAD_COVER_URL =
  /logo|favicon|icon-|\/icon\/|avatar|sprite|badge|pixel\.gif|1x1|spacer|blank\.|emoji|gravatar|us_flag_small|\/themes\/custom/i;

/** Old generic scam placeholder — same image on every card. */
export const LEGACY_SCAM_COVER =
  "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=1200&q=80&auto=format&fit=crop";

const SCAM_COVER_POOL = [
  "/covers/scam-01.svg",
  "/covers/scam-02.svg",
  "/covers/scam-03.svg",
  "/covers/scam-04.svg",
  "/covers/scam-05.svg",
  "/covers/scam-06.svg",
  "/covers/scam-07.svg",
  "/covers/scam-08.svg",
];

/** Local cover path for slug — always served from our domain. */
export function getLocalScamCoverPath(slug: string): string {
  return getScamCoverForSlug(slug);
}

export function getScamCoverForSlug(slug: string): string {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return SCAM_COVER_POOL[h % SCAM_COVER_POOL.length];
}

export function isGenericScamCover(url?: string | null): boolean {
  const u = url?.trim();
  if (!u) return true;
  return u === LEGACY_SCAM_COVER || u === CATEGORY_FALLBACKS.SCAMS;
}

export function getCategoryCoverFallback(category: Category): string {
  return CATEGORY_FALLBACKS[category];
}

const GENERIC_COVER_POOL = Object.entries(CATEGORY_FALLBACKS)
  .filter(([category]) => category !== "SCAMS")
  .map(([, url]) => url);

const GENERIC_COVERS = new Set([...GENERIC_COVER_POOL, LEGACY_SCAM_COVER]);

/**
 * Many articles store a stock category photo as their cover, so neighbouring
 * cards showed the same image. Walk the articles in display order and give each
 * repeated stock cover the next unused photo from the pool.
 */
export function spreadGenericCovers<
  T extends { slug: string; category: Category; coverImage?: string | null },
>(articles: T[]): T[] {
  const used = new Set<string>();
  return articles.map((article) => {
    const resolved = resolveArticleCover(article);
    if (!GENERIC_COVERS.has(resolved) || !used.has(resolved)) {
      used.add(resolved);
      return resolved === article.coverImage ? article : { ...article, coverImage: resolved };
    }
    const next = GENERIC_COVER_POOL.find((url) => !used.has(url));
    if (!next) return article;
    used.add(next);
    return { ...article, coverImage: next };
  });
}

export function isUsableCoverImage(url: string): boolean {
  const u = url.trim();
  if (!u) return false;
  if (u.startsWith("/covers/")) return true;
  if (!/^https?:\/\//i.test(u)) return false;
  if (BAD_COVER_URL.test(u)) return false;
  if (u.endsWith(".svg") && u.startsWith("http")) return false;
  return true;
}

export function resolveArticleCover(params: {
  coverImage?: string | null;
  category: Category;
  slug?: string;
}): string {
  const url = params.coverImage?.trim();
  const isRemoteUnsplash = url?.includes("images.unsplash.com");

  if (params.category === "SCAMS" && params.slug) {
    if (!url || isGenericScamCover(url) || isRemoteUnsplash) {
      return getScamCoverForSlug(params.slug);
    }
  }

  if (url && isUsableCoverImage(url)) return url;
  if (params.category === "SCAMS" && params.slug) {
    return getScamCoverForSlug(params.slug);
  }
  return getCategoryCoverFallback(params.category);
}

export function pickImageFromHtml(html: string): string | null {
  const patterns = [
    /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
  ];
  for (const re of patterns) {
    const m = html.match(re);
    const src = m?.[1]?.trim();
    if (src && isUsableCoverImage(src.startsWith("//") ? `https:${src}` : src)) {
      return src.startsWith("//") ? `https:${src}` : src;
    }
  }
  return null;
}

export function pickImageFromRssItem(content?: string): string | null {
  if (!content) return null;
  const m = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  const src = m?.[1]?.trim();
  if (!src) return null;
  const full = src.startsWith("//") ? `https:${src}` : src;
  return isUsableCoverImage(full) ? full : null;
}
