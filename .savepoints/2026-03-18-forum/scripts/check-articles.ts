import { config } from "dotenv";
config();

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [total, latest, sources] = await Promise.all([
    prisma.article.count(),
    prisma.article.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { title: true, source: true, createdAt: true },
    }),
    prisma.source.findMany({
      select: { name: true, lastFetched: true, active: true },
    }),
  ]);

  console.log("TOTAL_ARTICLES", total);
  console.log("LATEST", JSON.stringify(latest, null, 2));
  console.log("SOURCES", JSON.stringify(sources, null, 2));
}

main()
  .finally(() => prisma.$disconnect());
