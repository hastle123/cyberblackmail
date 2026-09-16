import { isArticleTranslated } from "@/lib/article-translated";
import {
  translateChunkFreeRace,
  translateLongTextFree,
} from "@/lib/llm/free-translate";
import { ollamaGenerate } from "@/lib/llm/ollama";

export { isArticleTranslated };

type RuFields = {
  titleRu: string | null;
  excerptRu: string | null;
  contentRu: string | null;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function translationPrompt(title: string, excerpt: string, body: string, source: string): string {
  return `Переведи на русский заголовок, краткое описание и основной текст новости о кибербезопасности.
Верни только JSON: {"titleRu":"...","excerptRu":"...","contentRu":"..."}
Источник: ${source}
Заголовок: ${title}
Описание: ${excerpt}
Текст: ${body.slice(0, 3500)}`;
}

function parseRuFields(raw: string): RuFields {
  const parsed = JSON.parse(raw) as RuFields;
  return {
    titleRu: parsed.titleRu?.trim() || null,
    excerptRu: parsed.excerptRu?.trim() || null,
    contentRu: parsed.contentRu?.trim() || null,
  };
}

async function tryLlm(
  title: string,
  ru: RuFields,
): Promise<RuFields | null> {
  if (isArticleTranslated({ title, titleRu: ru.titleRu })) return ru;
  return null;
}

async function translateWithOllama(
  title: string,
  excerpt: string,
  body: string,
  source: string,
): Promise<RuFields | null> {
  const raw = await ollamaGenerate(translationPrompt(title, excerpt, body, source), {
    system: "Ты редактор кибербезопасности. Отвечай только валидным JSON.",
    json: true,
    timeoutMs: 240_000,
  });
  return tryLlm(title, parseRuFields(raw));
}

/** Google Gemini — бесплатный ключ: https://aistudio.google.com/apikey */
async function translateWithGemini(
  apiKey: string,
  title: string,
  excerpt: string,
  body: string,
  source: string,
): Promise<RuFields | null> {
  const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: translationPrompt(title, excerpt, body, source) }] }],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: "application/json",
        },
      }),
      signal: AbortSignal.timeout(60_000),
    },
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const json = await res.json();
  const raw = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new Error("Empty Gemini response");
  return tryLlm(title, parseRuFields(raw));
}

/** Groq — бесплатный ключ: https://console.groq.com/keys */
async function translateWithGroq(
  apiKey: string,
  title: string,
  excerpt: string,
  body: string,
  source: string,
): Promise<RuFields | null> {
  const models = [
    process.env.GROQ_MODEL?.trim(),
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
  ].filter(Boolean) as string[];

  let lastError = "";
  for (const model of models) {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "Ты редактор кибербезопасности. Отвечай только валидным JSON." },
          { role: "user", content: translationPrompt(title, excerpt, body, source) },
        ],
      }),
      signal: AbortSignal.timeout(90_000),
    });
    if (!res.ok) {
      lastError = await res.text();
      if (res.status === 403 || res.status === 401) return null;
      continue;
    }
    const json = await res.json();
    const raw = json.choices?.[0]?.message?.content;
    if (!raw) continue;
    const ru = await tryLlm(title, parseRuFields(raw));
    if (ru) return ru;
  }
  throw new Error(`Groq failed: ${lastError.slice(0, 120)}`);
}

async function translateWithOpenAI(
  apiKey: string,
  title: string,
  excerpt: string,
  body: string,
  source: string,
): Promise<RuFields | null> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Ты редактор кибербезопасности. Отвечай только валидным JSON." },
        { role: "user", content: translationPrompt(title, excerpt, body, source) },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}`);
  const json = await res.json();
  const raw = json.choices?.[0]?.message?.content;
  if (!raw) throw new Error("Empty OpenAI response");
  return tryLlm(title, parseRuFields(raw));
}

type MyMemoryResponse = {
  responseData?: { translatedText?: string };
  quotaFinished?: boolean;
};

/** Lingva + LibreTranslate + MyMemory — параллельно, кто быстрее */
async function translateWithFreeApis(
  title: string,
  excerpt: string,
  body: string,
  source: string,
): Promise<RuFields | null> {
  try {
    const titleRu = (await translateChunkFreeRace(title.slice(0, 320), 0.28)).text;
    const excerptRu = (await translateChunkFreeRace((excerpt || title).slice(0, 480), 0.25)).text;
    const contentRu = await translateLongTextFree(body.slice(0, 2400), {
      chunkSize: 450,
      minRatio: 0.26,
      parallel: true,
    });

    if (!isArticleTranslated({ title, titleRu })) return null;

    const footer = `\n\n— Источник: ${source}. Перевод выполнен автоматически.`;
    return {
      titleRu,
      excerptRu: excerptRu !== excerpt ? excerptRu : titleRu,
      contentRu: contentRu + footer,
    };
  } catch {
    return null;
  }
}

async function translateChunkEnRu(text: string, attempt = 0): Promise<string> {
  const q = text.trim().slice(0, 500);
  if (!q) return text;
  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}&langpair=en|ru`,
      { signal: AbortSignal.timeout(25_000) },
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as MyMemoryResponse;
    if (json.quotaFinished) throw new Error("quota finished");

    const out = json.responseData?.translatedText?.trim();
    if (!out || out.toUpperCase() === q.toUpperCase()) {
      if (attempt < 3) {
        await sleep(1200 * (attempt + 1));
        return translateChunkEnRu(text, attempt + 1);
      }
      return text;
    }
    return out;
  } catch {
    if (attempt < 3) {
      await sleep(1500 * (attempt + 1));
      return translateChunkEnRu(text, attempt + 1);
    }
    return text;
  }
}

async function translateLongText(text: string, maxChunks = 4): Promise<string> {
  const chunks: string[] = [];
  for (let i = 0; i < text.length && chunks.length < maxChunks; i += 450) {
    chunks.push(text.slice(i, i + 450));
  }
  const parts: string[] = [];
  for (const chunk of chunks) {
    parts.push(await translateChunkEnRu(chunk));
    await sleep(800);
  }
  return parts.join(" ");
}

/** MyMemory — без ключа, ~1000 слов/день */
async function translateWithMyMemory(
  title: string,
  excerpt: string,
  body: string,
  source: string,
): Promise<RuFields | null> {
  const titleRu = await translateChunkEnRu(title);
  await sleep(800);
  const excerptRu = await translateChunkEnRu(excerpt);
  await sleep(800);
  const contentRu = await translateLongText(body.slice(0, 1800));

  if (!isArticleTranslated({ title, titleRu })) return null;

  const footer = `\n\n— Источник: ${source}. Перевод выполнен автоматически.`;
  return {
    titleRu,
    excerptRu: excerptRu !== excerpt ? excerptRu : titleRu,
    contentRu: contentRu + footer,
  };
}

export async function buildRussianFields(
  title: string,
  excerpt: string,
  body: string,
  source: string,
): Promise<RuFields> {
  const providers: Array<() => Promise<RuFields | null>> = [];

  providers.push(() => translateWithFreeApis(title, excerpt, body, source));

  if (process.env.OLLAMA_HOST?.trim()) {
    providers.push(() => translateWithOllama(title, excerpt, body, source));
  }

  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  if (geminiKey) {
    providers.push(() => translateWithGemini(geminiKey, title, excerpt, body, source));
  }

  const groqKey = process.env.GROQ_API_KEY?.trim();
  if (groqKey) {
    providers.push(() => translateWithGroq(groqKey, title, excerpt, body, source));
  }

  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  if (openaiKey) {
    providers.push(() => translateWithOpenAI(openaiKey, title, excerpt, body, source));
  }

  providers.push(() => translateWithMyMemory(title, excerpt, body, source));

  for (const run of providers) {
    try {
      const ru = await run();
      if (ru) return ru;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (process.env.TRANSLATE_DEBUG === "1") console.error("[translate]", msg);
    }
  }

  return emptyRussianFields();
}

function emptyRussianFields(): RuFields {
  return { titleRu: null, excerptRu: null, contentRu: null };
}

export async function translateArticleFields(article: {
  title: string;
  excerpt: string;
  content: string;
  source: string;
}): Promise<RuFields> {
  return buildRussianFields(article.title, article.excerpt, article.content, article.source);
}
