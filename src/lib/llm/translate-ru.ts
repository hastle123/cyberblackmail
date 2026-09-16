import {
  hasQualityRussianBody,
  isQualityRussianText,
  isArticleTranslated,
  cyrillicLetterRatio,
  hasEnglishLeakInRussian,
} from "@/lib/article-translated";
import {
  getTranslateMode,
  translateChunkFreeFallback,
  translateChunkFreeRace,
  translateLongTextFree,
  type ChunkTranslateResult,
} from "./free-translate";
import { isOllamaAvailable, ollamaGenerate } from "./ollama";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function ollamaPlainTranslate(text: string, attempt = 0): Promise<string> {
  const strict = attempt > 0;
  const out = await ollamaGenerate(
    strict
      ? `Переведи каждое слово на русский. Только перевод:\n${text}`
      : `Переведи на русский язык. Ответь только переводом:\n${text}`,
    {
      system: "Ты переводчик новостей о кибербезопасности. Пиши только по-русски.",
      timeoutMs: 150_000,
    },
  );
  return out.trim();
}

async function ollamaChunkTranslate(text: string, strict: boolean): Promise<string> {
  const rules = strict
    ? `- Каждое слово на русском, кроме имён, брендов, CVE и URL
- Запрещены английские слова: attack, wiretap, threat, device, users, security`
    : `- Имена, компании, CVE, URL оставляй как в оригинале
- Не смешивай английский и русский`;

  const out = await ollamaGenerate(
    `Переведи текст новости о кибербезопасности на русский язык.

Правила:
- Весь ответ только на русском
${rules}
- Не сокращай текст

Текст:
${text}`,
    {
      system: "Ты профессиональный переводчик. Отвечай только переводом.",
      timeoutMs: 180_000,
    },
  );
  return out.trim();
}

function minRatioForChunk(chunk: string): number {
  if (chunk.length < 200) return 0.25;
  if (chunk.length < 600) return 0.32;
  return 0.36;
}

async function translateWithOllama(chunk: string, attempt: number): Promise<string> {
  const minRatio = Math.min(minRatioForChunk(chunk), 0.32);
  const translated = await ollamaChunkTranslate(chunk, attempt > 1);
  if (isQualityRussianText(translated, minRatio)) return translated;
  throw new Error("Ollama chunk quality low");
}

async function translateChunkDual(chunk: string, minRatio: number): Promise<ChunkTranslateResult> {
  const ollamaReady = await isOllamaAvailable();

  return new Promise((resolve, reject) => {
    let settled = false;
    let failures = 0;
    const errors: string[] = [];
    const runners = ollamaReady ? 2 : 1;

    const done = (result: ChunkTranslateResult) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    const fail = (name: string, err: unknown) => {
      if (settled) return;
      failures++;
      errors.push(`${name}: ${err instanceof Error ? err.message : String(err)}`);
      if (failures >= runners) {
        settled = true;
        reject(new Error(errors.join("; ")));
      }
    };

    translateChunkFreeRace(chunk, minRatio)
      .then(done)
      .catch((err) => fail("free", err));

    if (ollamaReady) {
      translateWithOllama(chunk, 0)
        .then((text) => done({ text, provider: "ollama" }))
        .catch((err) => fail("ollama", err));
    }
  });
}

export async function translateChunkToRussian(text: string, attempt = 0): Promise<string> {
  const chunk = text.trim();
  if (!chunk) return "";

  const minRatio = minRatioForChunk(chunk);
  const mode = getTranslateMode();

  if (mode === "fast") {
    const { text: ru } = await translateChunkFreeRace(chunk, minRatio);
    return ru;
  }

  if (mode === "dual") {
    try {
      const { text: ru } = await translateChunkDual(chunk, minRatio);
      return ru;
    } catch {
      const { text: ru } = await translateChunkFreeFallback(chunk, minRatio);
      return ru;
    }
  }

  // quality: Ollama first, then free APIs
  try {
    return await translateWithOllama(chunk, attempt);
  } catch {
    if (attempt < 2) {
      await sleep(500 * (attempt + 1));
      return translateChunkToRussian(chunk, attempt + 1);
    }

    for (let plainTry = 0; plainTry < 3; plainTry++) {
      try {
        const plain = await ollamaPlainTranslate(chunk, plainTry);
        if (isQualityRussianText(plain, 0.28)) return plain;
        if (plain.trim().length > 30 && cyrillicLetterRatio(plain) >= 0.25) return plain;
      } catch {
        /* next */
      }
    }

    try {
      const { text: ru } = await translateChunkFreeFallback(chunk, minRatio);
      return ru;
    } catch {
      const plain = await ollamaPlainTranslate(chunk, 1);
      if (plain.trim().length > 20 && cyrillicLetterRatio(plain) >= 0.18) return plain;
      throw new Error("No translation providers available");
    }
  }
}

async function translateBody(body: string): Promise<string> {
  const clean = body.trim();
  if (!clean) return "";

  const mode = getTranslateMode();
  if (mode === "fast" || mode === "dual") {
    return translateLongTextFree(clean, {
      chunkSize: 450,
      minRatio: 0.28,
      parallel: mode === "dual",
    });
  }

  const chunkSize = 1100;
  const parts: string[] = [];
  for (let i = 0; i < clean.length; i += chunkSize) {
    parts.push(await translateChunkToRussian(clean.slice(i, i + chunkSize)));
    if (i + chunkSize < clean.length) await sleep(350);
  }
  return parts.join("\n\n");
}

async function translateTitleRu(title: string): Promise<string> {
  const en = title.trim();
  const mode = getTranslateMode();

  const tries: Array<() => Promise<string>> = [];

  if (mode === "fast" || mode === "dual") {
    tries.push(async () => (await translateChunkFreeRace(en.slice(0, 320), 0.28)).text);
  }

  if (mode !== "fast") {
    tries.push(() => translateChunkToRussian(en.slice(0, 320)));
    tries.push(() => ollamaPlainTranslate(en.slice(0, 320)));
  }

  tries.push(async () => (await translateChunkFreeFallback(en.slice(0, 320), 0.28)).text);

  for (const run of tries) {
    try {
      const ru = (await run()).trim();
      if (hasEnglishLeakInRussian(ru)) continue;
      if (isArticleTranslated({ title: en, titleRu: ru }) && isQualityRussianText(ru, 0.28)) {
        return ru;
      }
    } catch {
      /* next */
    }
  }

  for (let i = 0; i < 2; i++) {
    try {
      const ru = (await ollamaPlainTranslate(en.slice(0, 320), i)).trim();
      if (hasEnglishLeakInRussian(ru)) continue;
      if (ru && cyrillicLetterRatio(ru) >= 0.22) return ru;
    } catch {
      /* next */
    }
  }
  throw new Error("Invalid Russian title");
}

async function translateMeta(
  title: string,
  excerpt: string,
): Promise<{ titleRu: string; excerptRu: string }> {
  const titleRu = await translateTitleRu(title);

  const excerptSource = (excerpt || title).trim().slice(0, 480);
  let excerptRu = titleRu;
  try {
    excerptRu = await translateChunkToRussian(excerptSource);
  } catch {
    try {
      const { text } = await translateChunkFreeRace(excerptSource, 0.25);
      excerptRu = text;
    } catch {
      excerptRu = titleRu;
    }
  }

  if (!isQualityRussianText(excerptRu, 0.22)) {
    excerptRu = titleRu;
  }

  return { titleRu, excerptRu };
}

export type RussianTranslation = {
  titleRu: string;
  excerptRu: string;
  contentRu: string;
};

function bodyForQualityCheck(contentRu: string): string {
  return contentRu.replace(/\n\n— Источник:[\s\S]*$/, "").trim();
}

export async function translateArticleToRussian(article: {
  title: string;
  excerpt: string;
  content: string;
  source: string;
}): Promise<RussianTranslation> {
  const bodySource = article.content.includes("\n\n---\n\n")
    ? article.content.split("\n\n---\n\n").slice(1).join("\n\n---\n\n").trim()
    : article.content.trim();

  const { titleRu, excerptRu } = await translateMeta(article.title, article.excerpt);

  const bodyRu = await translateBody(bodySource);
  const contentRu = `${bodyRu}\n\n— Источник: ${article.source}. Материал подготовлен редакцией CyberBlackmail.`;

  if (!hasQualityRussianBody(bodyForQualityCheck(contentRu))) {
    throw new Error("Full Russian body quality check failed");
  }

  return { titleRu, excerptRu, contentRu };
}
