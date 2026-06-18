export function isArticleTranslated(article: {
  title: string;
  titleRu?: string | null;
}): boolean {
  if (!article.titleRu?.trim()) return false;
  return article.titleRu.trim() !== article.title.trim();
}
