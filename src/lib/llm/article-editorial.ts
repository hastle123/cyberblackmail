import { ollamaGenerate } from "./ollama";
import {
  translateArticleToRussian,
  translateChunkToRussian,
  type RussianTranslation,
} from "./translate-ru";

export type EditorialResult = RussianTranslation & {
  contentEn: string;
};

function parseAnalysis(raw: string): string {
  const trimmed = raw.trim();
  const jsonBlock = trimmed.match(/\{[\s\S]*\}/);
  if (jsonBlock) {
    const parsed = JSON.parse(jsonBlock[0]) as { analysisEn?: string };
    if (parsed.analysisEn?.trim()) return parsed.analysisEn.trim();
  }
  if (trimmed.length > 80) return trimmed;
  throw new Error("Invalid editorial JSON from Ollama");
}

async function buildAnalysisEn(article: {
  title: string;
  excerpt: string;
  content: string;
  source: string;
  category: string;
}): Promise<string> {
  const body = article.content.includes("\n\n---\n\n")
    ? article.content.split("\n\n---\n\n").slice(-1)[0]
    : article.content;

  const raw = await ollamaGenerate(
    `Write 2-4 short paragraphs in English for CyberBlackmail readers: what happened, who is affected, scam method if any, practical takeaway.

Return JSON: {"analysisEn":"your paragraphs here"}

Category: ${article.category}
Source: ${article.source}
Title: ${article.title}
Excerpt: ${article.excerpt}
Body:
${body.slice(0, 10_000)}`,
    {
      system: "Reply with valid JSON only. No markdown fences.",
      json: true,
      timeoutMs: 120_000,
    },
  );

  const analysis = parseAnalysis(raw);
  if (analysis.length < 80) throw new Error("Editorial too short");
  return analysis;
}

export async function buildEditorialWithOllama(article: {
  title: string;
  excerpt: string;
  content: string;
  source: string;
  category: string;
}): Promise<EditorialResult> {
  const bodyOnly = article.content.includes("\n\n---\n\n")
    ? article.content.split("\n\n---\n\n").slice(-1)[0].trim()
    : article.content.trim();

  const [analysisEn, ru] = await Promise.all([
    buildAnalysisEn({ ...article, content: bodyOnly }),
    translateArticleToRussian({ ...article, content: bodyOnly }),
  ]);

  const analysisRu = await translateChunkToRussian(analysisEn);
  const fullEn = `${analysisEn}\n\n---\n\n${bodyOnly}`;
  const contentRu = `${analysisRu}\n\n---\n\n${ru.contentRu.split("\n\n— Источник:")[0].trim()}\n\n— Источник: ${article.source}. Материал подготовлен редакцией CyberBlackmail.`;

  return {
    contentEn: fullEn,
    titleRu: ru.titleRu,
    excerptRu: ru.excerptRu,
    contentRu,
  };
}
