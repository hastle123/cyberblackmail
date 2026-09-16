import dotenv from "dotenv";
import { resolve } from "path";

dotenv.config();
dotenv.config({ path: resolve(process.cwd(), ".env.local"), override: true });

import { decodeHtmlEntities } from "../src/lib/article-text";
import { cyrillicLetterRatio } from "../src/lib/article-translated";
import type { Severity } from "@prisma/client";

function alertMessageRu(title: string, severity: Severity): string {
  const prefix =
    severity === "CRITICAL" ? "Критично" : severity === "HIGH" ? "Высокий" : "Средний";
  return `${prefix}: ${decodeHtmlEntities(title)}`;
}

function needsRussian(alert: { message: string; messageRu?: string | null }): boolean {
  const ru = alert.messageRu?.trim();
  if (!ru) return true;
  if (ru === alert.message) return true;
  if (/&#\d+;|&[a-z]+;/i.test(ru)) return true;
  return cyrillicLetterRatio(ru) < 0.2;
}

function severityFromMatch(word: string): Severity {
  const w = word.toLowerCase();
  if (w === "critical") return "CRITICAL";
  if (w === "high") return "HIGH";
  return "MEDIUM";
}

async function main() {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  try {
    const alerts = await prisma.alert.findMany({
      include: { article: { select: { title: true, titleRu: true } } },
      orderBy: { createdAt: "desc" },
    });

    let updated = 0;
    for (const alert of alerts) {
      if (!needsRussian(alert)) continue;

      const match = alert.message.match(/^New (critical|high|medium) report:\s*(.+)$/i);
      const scamMatch = alert.message.match(/^Скам \((.+?)\):\s*(.+)$/i);

      let messageRu: string | null = null;

      if (match) {
        const sev = severityFromMatch(match[1]);
        const titleRu = alert.article?.titleRu?.trim();
        messageRu = alertMessageRu(titleRu || match[2], sev);
      } else if (scamMatch) {
        messageRu = decodeHtmlEntities(alert.message);
      } else {
        messageRu = decodeHtmlEntities(alert.message);
      }

      await prisma.alert.update({
        where: { id: alert.id },
        data: { messageRu },
      });
      updated++;
    }

    console.log(`Done. Updated ${updated} alert(s).`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
