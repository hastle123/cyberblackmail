import dotenv from "dotenv";
import { resolve } from "path";
import { spawn } from "child_process";

dotenv.config();
dotenv.config({ path: resolve(process.cwd(), ".env.local"), override: true });

const MAX_ROUNDS = Number(process.env.TRANSLATE_ROUNDS ?? "30");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function runProcessLocal(): Promise<number> {
  return new Promise((resolveCode, reject) => {
    const child = spawn("npm", ["run", "process:local"], {
      cwd: process.cwd(),
      shell: true,
      stdio: "inherit",
      env: process.env,
    });
    child.on("error", reject);
    child.on("close", (code) => resolveCode(code ?? 1));
  });
}

async function countPending(): Promise<{ total: number; pending: number; translated: number }> {
  const { PrismaClient } = await import("@prisma/client");
  const { hasQualityRussianBody, isArticleTranslated } = await import("../src/lib/article-translated");
  const p = new PrismaClient();
  try {
    const articles = await p.article.findMany({
      select: { title: true, titleRu: true, contentRu: true },
    });
    const translated = articles.filter(
      (a) => isArticleTranslated(a) && hasQualityRussianBody(a.contentRu),
    ).length;
    return { total: articles.length, pending: articles.length - translated, translated };
  } finally {
    await p.$disconnect();
  }
}

async function main() {
  for (let round = 1; round <= MAX_ROUNDS; round++) {
    const before = await countPending();
    console.log(`\n=== Round ${round}/${MAX_ROUNDS} — RU ok: ${before.translated}/${before.total}, pending: ${before.pending} ===`);
    if (before.pending === 0) {
      console.log("All articles have Russian translation.");
      return;
    }

    const code = await runProcessLocal();
    if (code !== 0) {
      console.warn(`process:local exited with code ${code}, retrying after pause…`);
      await sleep(5000);
    }

    const after = await countPending();
    if (after.pending >= before.pending && round > 1) {
      console.warn("No progress this round — stopping to avoid infinite loop.");
      break;
    }
    await sleep(2000);
  }

  const final = await countPending();
  console.log(`\nFinished. RU ok: ${final.translated}/${final.total}, still pending: ${final.pending}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
