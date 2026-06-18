import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const FEEDS = [
  { name: "BleepingComputer", rssUrl: "https://www.bleepingcomputer.com/feed/" },
  { name: "The Record", rssUrl: "https://therecord.media/feed/" },
  { name: "CISA Alerts", rssUrl: "https://www.cisa.gov/cybersecurity-advisories/all.xml" },
  { name: "Krebs on Security", rssUrl: "https://krebsonsecurity.com/feed/" },
] as const;

async function main() {
  for (const feed of FEEDS) {
    await prisma.source.upsert({
      where: { rssUrl: feed.rssUrl },
      create: { ...feed, active: true },
      update: { name: feed.name, active: true },
    });
  }
  const count = await prisma.source.count({ where: { active: true } });
  console.log(`RSS sources ready: ${count}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
