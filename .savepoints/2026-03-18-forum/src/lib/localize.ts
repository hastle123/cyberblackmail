import { isArticleTranslated } from "@/lib/article-translated";

type LocalizableArticleFields = {
  title: string;
  excerpt: string;
  content?: string;
  titleRu?: string | null;
  excerptRu?: string | null;
  contentRu?: string | null;
};

type LocalizableAlert = {
  message: string;
  messageRu?: string | null;
};

type LocalizableAnalysis = {
  executiveSummary: string;
  attackVector: string;
  impact: string;
  targetIndustry: string;
  executiveSummaryRu?: string | null;
  attackVectorRu?: string | null;
  impactRu?: string | null;
  targetIndustryRu?: string | null;
};

export function localizeArticle<T extends LocalizableArticleFields>(article: T, locale: string): T {
  if (locale !== "ru" || !isArticleTranslated(article)) return article;
  return {
    ...article,
    title: article.titleRu!,
    excerpt: article.excerptRu ?? article.excerpt,
    content: article.contentRu ?? article.content ?? "",
  };
}

export { isArticleTranslated } from "@/lib/article-translated";

export function localizeAlert<T extends LocalizableAlert>(alert: T, locale: string): T {
  if (locale !== "ru" || !alert.messageRu) return alert;
  return { ...alert, message: alert.messageRu };
}

export function localizeAnalysis<T extends LocalizableAnalysis>(analysis: T, locale: string): T {
  if (locale !== "ru" || !analysis.executiveSummaryRu) return analysis;

  let mitigations = (analysis as { mitigations?: unknown }).mitigations;
  if (mitigations && typeof mitigations === "object" && !Array.isArray(mitigations)) {
    const obj = mitigations as {
      immediate?: string[];
      strategic?: string[];
      ru?: { immediate?: string[]; strategic?: string[] };
    };
    if (obj.ru) {
      mitigations = {
        immediate: obj.ru.immediate ?? obj.immediate,
        strategic: obj.ru.strategic ?? obj.strategic,
      };
    }
  }

  return {
    ...analysis,
    executiveSummary: analysis.executiveSummaryRu,
    attackVector: analysis.attackVectorRu ?? analysis.attackVector,
    impact: analysis.impactRu ?? analysis.impact,
    targetIndustry: analysis.targetIndustryRu ?? analysis.targetIndustry,
    mitigations,
  };
}

export function localizeArticleRef<T extends { title: string; titleRu?: string | null }>(
  ref: T,
  locale: string,
): T {
  if (locale !== "ru" || !isArticleTranslated(ref)) return ref;
  return { ...ref, title: ref.titleRu! };
}

type LocalizableForumText = {
  name?: string;
  nameRu?: string | null;
  description?: string | null;
  descriptionRu?: string | null;
  title?: string;
  titleRu?: string | null;
  content: string;
  contentRu?: string | null;
};

export function localizeForumCategory<T extends LocalizableForumText & { name: string }>(
  item: T,
  locale: string,
): T {
  if (locale !== "ru" || !item.nameRu) return item;
  return {
    ...item,
    name: item.nameRu,
    description: item.descriptionRu ?? item.description,
  };
}

export function localizeForumTopic<T extends LocalizableForumText & { title: string }>(
  item: T,
  locale: string,
): T {
  if (locale !== "ru" || !item.titleRu) return item;
  return {
    ...item,
    title: item.titleRu,
    content: item.contentRu ?? item.content,
  };
}

export function localizeForumPost<T extends { content: string; contentRu?: string | null }>(
  post: T,
  locale: string,
): T {
  if (locale !== "ru" || !post.contentRu) return post;
  return { ...post, content: post.contentRu };
}
