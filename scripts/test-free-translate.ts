import dotenv from "dotenv";
import { resolve } from "path";

dotenv.config();
dotenv.config({ path: resolve(process.cwd(), ".env.local"), override: true });

import { translateChunkFreeRace, translateChunkFreeFallback } from "../src/lib/llm/free-translate";

const sample =
  process.argv[2] ??
  "Police dismantle crypto scam ring targeting Binance users across Southeast Asia";

async function probeLibre(url: string) {
  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: "hello", source: "en", target: "ru", format: "text" }),
      signal: AbortSignal.timeout(15_000),
    });
    const text = await res.text();
    console.log(`Libre ${url}: ${res.status} ${text.slice(0, 120)}`);
  } catch (e) {
    console.log(`Libre ${url}: FAIL`, e instanceof Error ? e.message : e);
  }
}

async function probeLingva(url: string) {
  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/api/v1/en/ru/hello`, {
      signal: AbortSignal.timeout(15_000),
    });
    const text = await res.text();
    console.log(`Lingva ${url}: ${res.status} ${text.slice(0, 120)}`);
  } catch (e) {
    console.log(`Lingva ${url}: FAIL`, e instanceof Error ? e.message : e);
  }
}

async function main() {
  if (process.argv.includes("--probe")) {
    for (const u of [
      "https://libretranslate.de",
      "https://translate.astian.org",
      "https://translate.argosopentech.com",
      "https://translate.flossboxin.org.in",
      "https://libretranslate.com",
    ]) {
      await probeLibre(u);
    }
    for (const u of [
      "https://lingva.ml",
      "https://lingva.lunar.icu",
      "https://lingva.garudalinux.org",
      "https://translate.plausibility.cloud",
    ]) {
      await probeLingva(u);
    }
    return;
  }

  console.log("EN:", sample);
  console.log("\n--- Race (parallel) ---");
  try {
    const race = await translateChunkFreeRace(sample, 0.25);
    console.log(`[${race.provider}]`, race.text);
  } catch (e) {
    console.error("Race failed:", e instanceof Error ? e.message : e);
  }

  console.log("\n--- Fallback (sequential) ---");
  try {
    const fb = await translateChunkFreeFallback(sample, 0.25);
    console.log(`[${fb.provider}]`, fb.text);
  } catch (e) {
    console.error("Fallback failed:", e instanceof Error ? e.message : e);
  }
}

main();
