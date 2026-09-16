import dotenv from "dotenv";
import { resolve } from "path";

dotenv.config();
dotenv.config({ path: resolve(process.cwd(), ".env.local"), override: true });

import { isScamArticleContent } from "../src/lib/scams";

async function main() {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  try {
    const articles = await prisma.article.findMany({
      where: { category: "SCAMS" },
      orderBy: { publishedAt: "desc" },
      select: {
        slug: true,
        title: true,
        excerpt: true,
        content: true,
        source: true,
        sourceUrl: true,
        publishedAt: true,
        createdAt: true,
        contentRu: true,
      },
    });

    const scamSources = await prisma.source.findMany({
      where: { name: { startsWith: "[Scams]" } },
      select: { name: true, lastFetched: true, active: true },
    });

    const auditLogs = await prisma.auditLog.findMany({
      where: { action: "SCAM_INGEST_CREATE" },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { createdAt: true, entity: true, metadata: true },
    });

    console.log(`\n=== SCAMS в базе: ${articles.length} ===\n`);

    let shortContent = 0;
    let pendingEnrich = 0;
    let misclassified = 0;

    for (const a of articles) {
      const contentLen = a.content?.length ?? 0;
      const isPending = /full analysis pending|ingest —/i.test(a.content ?? "");
      const valid = isScamArticleContent(a.title, a.excerpt ?? "");

      if (contentLen < 400) shortContent++;
      if (isPending) pendingEnrich++;
      if (!valid) misclassified++;

      const age = Math.round((Date.now() - a.publishedAt.getTime()) / 3600000);
      console.log(`[${a.source}] ${age}h ago | content: ${contentLen}ch | RU: ${a.contentRu ? "yes" : "no"}`);
      console.log(`  ${a.title.slice(0, 90)}${a.title.length > 90 ? "…" : ""}`);
      console.log(`  excerpt: ${(a.excerpt ?? "").slice(0, 120)}…`);
      if (!valid) console.log(`  ⚠ NOT scam content (filter would hide)`);
      if (isPending) console.log(`  ⚠ stub content — needs enrich`);
      console.log();
    }

    console.log("=== Summary ===");
    console.log(`Short content (<400ch): ${shortContent}`);
    console.log(`Stub / pending enrich: ${pendingEnrich}`);
    console.log(`Misclassified (isScamArticleContent=false): ${misclassified}`);

    console.log("\n=== Scam RSS sources ===");
    for (const s of scamSources) {
      const last = s.lastFetched ? s.lastFetched.toISOString() : "never";
      console.log(`${s.active ? "✓" : "✗"} ${s.name} — last: ${last}`);
    }

    console.log("\n=== Last scam ingest events ===");
    if (auditLogs.length === 0) console.log("(none)");
    for (const l of auditLogs) {
      console.log(`${l.createdAt.toISOString()} — ${l.entity}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
