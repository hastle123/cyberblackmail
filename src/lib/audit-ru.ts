import {
  hasDisallowedLatin,
  hasEnglishLeakInRussian,
  hasGarbageMixedScript,
  hasQualityRussianBody,
  isArticleTranslated,
  isRuTitleAcceptable,
  suspiciousEnglishWords,
} from "./article-translated";

export type BadRuReason =
  | "no_title"
  | "bad_title"
  | "bad_body"
  | "garbage"
  | "english_leak"
  | "mixed_script"
  | "truncated"
  | "too_short";

export function auditRussianArticle(article: {
  title: string;
  excerpt: string;
  content: string;
  titleRu?: string | null;
  excerptRu?: string | null;
  contentRu?: string | null;
}): BadRuReason[] {
  const reasons: BadRuReason[] = [];
  const titleRu = article.titleRu?.trim() ?? "";
  const excerptRu = article.excerptRu?.trim() ?? "";
  const contentRu = article.contentRu?.trim() ?? "";

  if (!titleRu) reasons.push("no_title");
  else if (!isRuTitleAcceptable(article.title, titleRu)) reasons.push("bad_title");
  else if (!isArticleTranslated({ title: article.title, titleRu })) reasons.push("bad_title");

  if (!contentRu) reasons.push("bad_body");
  else if (!hasQualityRussianBody(contentRu)) reasons.push("bad_body");

  if (hasGarbageMixedScript(titleRu) || hasGarbageMixedScript(excerptRu) || hasGarbageMixedScript(contentRu)) {
    reasons.push("garbage");
  }

  if (
    hasEnglishLeakInRussian(titleRu) ||
    hasEnglishLeakInRussian(excerptRu) ||
    hasEnglishLeakInRussian(contentRu.slice(0, 400))
  ) {
    reasons.push("english_leak");
  }

  if (hasDisallowedLatin(titleRu) || hasDisallowedLatin(excerptRu)) {
    reasons.push("mixed_script");
  }
  if (contentRu.length < 500 && hasDisallowedLatin(contentRu)) {
    reasons.push("mixed_script");
  }

  const endsTruncated = /(\.\.\.|…)\s*$/.test(contentRu) || contentRu.includes("...\n");
  if (
    endsTruncated ||
    (contentRu.includes("…") &&
      contentRu.length < Math.max(700, article.content.length * 0.5))
  ) {
    reasons.push("truncated");
  }

  if (
    article.content.length > 500 &&
    contentRu.length > 0 &&
    contentRu.length < article.content.length * 0.3
  ) {
    reasons.push("too_short");
  }

  // Suspicious glued tokens in body (not brand names standing alone)
  if (contentRu.length > 60) {
    const words = contentRu.split(/\s+/).filter(Boolean).length || 1;
    const badTokens =
      suspiciousEnglishWords(contentRu) -
      (contentRu.match(/\bCVE-\d{4}-\d+\b/gi)?.length ?? 0);
    if (badTokens / words > 0.22 && hasDisallowedLatin(contentRu)) {
      reasons.push("garbage");
    }
  }

  return [...new Set(reasons)];
}

export function isBadRussianArticle(article: Parameters<typeof auditRussianArticle>[0]): boolean {
  return auditRussianArticle(article).length > 0;
}

export function badRuSeverity(reasons: BadRuReason[]): number {
  const score: Record<BadRuReason, number> = {
    garbage: 5,
    mixed_script: 5,
    english_leak: 4,
    truncated: 4,
    too_short: 3,
    bad_title: 3,
    bad_body: 3,
    no_title: 5,
  };
  return reasons.reduce((s, r) => s + (score[r] ?? 1), 0);
}
