import { isQualityRussianText } from "@/lib/article-translated";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type FreeTranslateProvider = "lingva" | "libretranslate" | "mymemory";

const DEFAULT_LINGVA = [
  "https://lingva.lunar.icu",
  "https://translate.plausibility.cloud",
  "https://lingva.ml",
  "https://lingva.garudalinux.org",
];

const DEFAULT_LIBRE = [
  "http://127.0.0.1:5000",
  "http://localhost:5000",
  "https://translate.flossboxin.org.in",
  "https://libretranslate.de",
  "https://translate.astian.org",
  "https://translate.argosopentech.com",
  "https://libretranslate.com",
];

let myMemoryQuotaFinished = false;
let libreTranslateQueue: Promise<unknown> = Promise.resolve();

function withLibreTranslateLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = libreTranslateQueue.then(fn, fn);
  libreTranslateQueue = run.catch(() => undefined);
  return run;
}

function lingvaInstances(): string[] {
  const raw = process.env.LINGVA_INSTANCES?.trim();
  if (!raw) return DEFAULT_LINGVA;
  return raw.split(",").map((u) => u.trim()).filter(Boolean);
}

function libreTranslateUrls(): string[] {
  const raw = process.env.LIBRETRANSLATE_URL?.trim();
  if (!raw) return DEFAULT_LIBRE;
  const fromEnv = raw.split(",").map((u) => u.trim()).filter(Boolean);
  return [...new Set([...fromEnv, ...DEFAULT_LIBRE])];
}

function libreTranslateKey(): string | undefined {
  return process.env.LIBRETRANSLATE_API_KEY?.trim() || undefined;
}

function enabledProviders(): FreeTranslateProvider[] {
  const raw = process.env.FREE_TRANSLATE_PROVIDERS?.trim();
  if (!raw) return ["lingva", "libretranslate", "mymemory"];
  return raw
    .split(",")
    .map((p) => p.trim().toLowerCase())
    .filter((p): p is FreeTranslateProvider =>
      p === "lingva" || p === "libretranslate" || p === "mymemory",
    );
}

export function getTranslateMode(): "fast" | "quality" | "dual" {
  const mode = process.env.TRANSLATE_MODE?.trim().toLowerCase();
  if (mode === "fast" || mode === "dual") return mode;
  return "quality";
}

function chunkLimit(provider: FreeTranslateProvider): number {
  if (provider === "mymemory") return 480;
  if (provider === "lingva") return 1400;
  return 2000;
}

function validateChunk(
  out: string,
  source: string,
  minRatio: number,
  provider?: FreeTranslateProvider,
): boolean {
  const trimmed = out.trim();
  if (!trimmed || trimmed.toUpperCase() === source.trim().toUpperCase()) return false;
  const ratio =
    provider === "libretranslate" ? Math.max(0.22, minRatio - 0.1) : minRatio;
  return isQualityRussianText(trimmed, ratio);
}

async function translateLingva(text: string, instance: string): Promise<string> {
  const q = text.trim().slice(0, chunkLimit("lingva"));
  const url = `${instance.replace(/\/$/, "")}/api/v1/en/ru/${encodeURIComponent(q)}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(18_000),
  });
  if (res.status === 403 || res.status === 404) throw new Error(`Lingva HTTP ${res.status}`);
  if (!res.ok) throw new Error(`Lingva HTTP ${res.status}`);
  const json = (await res.json()) as { translation?: string; error?: string };
  if (json.error) throw new Error(json.error);
  const out = json.translation?.trim();
  if (!out) throw new Error("Lingva empty");
  return out;
}

async function translateLibreTranslate(text: string): Promise<string> {
  const q = text.trim().slice(0, chunkLimit("libretranslate"));
  const body: Record<string, string> = {
    q,
    source: "en",
    target: "ru",
    format: "text",
  };
  const key = libreTranslateKey();
  if (key) body.api_key = key;

  let last: unknown;
  for (const base of libreTranslateUrls()) {
    try {
      return await withLibreTranslateLock(async () => {
        const res = await fetch(`${base.replace(/\/$/, "")}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(base.includes("127.0.0.1") || base.includes("localhost") ? 8_000 : 18_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { translatedText?: string; error?: string };
      if (json.error) throw new Error(json.error);
      const out = json.translatedText?.trim();
      if (!out) throw new Error("empty");
      return out;
      });
    } catch (err) {
      last = err;
    }
  }
  throw last instanceof Error ? last : new Error("LibreTranslate failed");
}

async function translateMyMemory(text: string, attempt = 0): Promise<string> {
  if (myMemoryQuotaFinished) throw new Error("MyMemory quota finished");
  const q = text.trim().slice(0, chunkLimit("mymemory"));
  if (!q) return "";

  const email = process.env.MYMEMORY_EMAIL?.trim();
  const emailParam = email ? `&de=${encodeURIComponent(email)}` : "";
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}&langpair=en|ru${emailParam}`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
    if (res.status === 429) throw new Error("HTTP 429");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as {
      responseData?: { translatedText?: string };
      quotaFinished?: boolean;
    };
    if (json.quotaFinished) {
      myMemoryQuotaFinished = true;
      throw new Error("MyMemory quota finished");
    }
    const out = json.responseData?.translatedText?.trim();
    if (!out || out.toUpperCase() === q.toUpperCase()) throw new Error("MyMemory unchanged");
    return out;
  } catch (err) {
    if (attempt < 3) {
      await sleep(2000 * (attempt + 1));
      return translateMyMemory(text, attempt + 1);
    }
    throw err instanceof Error ? err : new Error("MyMemory failed");
  }
}

async function runProvider(
  provider: FreeTranslateProvider,
  text: string,
): Promise<string> {
  if (provider === "lingva") {
    let last: unknown;
    for (const instance of lingvaInstances()) {
      try {
        return await translateLingva(text, instance);
      } catch (err) {
        last = err;
      }
    }
    throw last instanceof Error ? last : new Error("Lingva failed");
  }
  if (provider === "libretranslate") return translateLibreTranslate(text);
  return translateMyMemory(text);
}

export type ChunkTranslateResult = {
  text: string;
  provider: FreeTranslateProvider | "ollama";
};

/** Run free APIs in parallel — first valid result wins (fastest). */
export async function translateChunkFreeRace(
  text: string,
  minRatio = 0.3,
): Promise<ChunkTranslateResult> {
  const source = text.trim();
  if (!source) return { text: "", provider: "mymemory" };

  const providers = enabledProviders().filter(
    (p) => !(p === "mymemory" && myMemoryQuotaFinished),
  );
  if (providers.length === 0) throw new Error("No free translate providers");

  return new Promise((resolve, reject) => {
    let settled = false;
    let failures = 0;
    const errors: string[] = [];

    const finish = (result: ChunkTranslateResult) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    const fail = (provider: string, err: unknown) => {
      if (settled) return;
      failures++;
      errors.push(`${provider}: ${err instanceof Error ? err.message : String(err)}`);
      if (failures >= providers.length) {
        settled = true;
        reject(new Error(errors.join("; ")));
      }
    };

    for (const provider of providers) {
      runProvider(provider, source)
        .then((out) => {
          if (validateChunk(out, source, minRatio, provider)) {
            finish({ text: out, provider });
          } else {
            fail(provider, "quality low");
          }
        })
        .catch((err) => fail(provider, err));
    }
  });
}

/** Sequential fallback through free APIs. */
export async function translateChunkFreeFallback(
  text: string,
  minRatio = 0.3,
): Promise<ChunkTranslateResult> {
  const source = text.trim();
  const errors: string[] = [];

  for (const provider of enabledProviders()) {
    if (provider === "mymemory" && myMemoryQuotaFinished) continue;
    try {
      const out = await runProvider(provider, source);
      if (validateChunk(out, source, minRatio, provider)) {
        return { text: out, provider };
      }
      errors.push(`${provider}: quality low`);
    } catch (err) {
      errors.push(`${provider}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  throw new Error(errors.join("; ") || "Free translate failed");
}

export async function translateLongTextFree(
  text: string,
  opts?: { chunkSize?: number; minRatio?: number; parallel?: boolean },
): Promise<string> {
  const clean = text.trim();
  if (!clean) return "";

  const chunkSize = opts?.chunkSize ?? 450;
  const minRatio = opts?.minRatio ?? 0.28;
  const translate = opts?.parallel
    ? (chunk: string) => translateChunkFreeRace(chunk, minRatio)
    : (chunk: string) => translateChunkFreeFallback(chunk, minRatio);

  const parts: string[] = [];
  for (let i = 0; i < clean.length; i += chunkSize) {
    const slice = clean.slice(i, i + chunkSize);
    const { text: ru } = await translate(slice);
    parts.push(ru);
    if (i + chunkSize < clean.length) await sleep(200);
  }
  return parts.join(" ");
}

export function resetFreeTranslateState(): void {
  myMemoryQuotaFinished = false;
}
