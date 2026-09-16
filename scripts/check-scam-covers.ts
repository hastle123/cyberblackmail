import dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(process.cwd(), ".env.local"), override: true });
import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();
  const rows = await prisma.article.findMany({
    select: { slug: true, coverImage: true, category: true },
  });
  const php = rows.filter(
    (r) =>
      r.coverImage?.includes("helpnet") ||
      r.coverImage?.includes("laptop-security") ||
      r.coverImage?.match(/\.php|code|wordpress/i),
  );
  console.log("HelpNet/code-like covers:", php.length);
  php.slice(0, 8).forEach((r) => console.log(r.slug, "\n ", r.coverImage?.slice(0, 100)));

  const houston = rows.filter((r) => r.slug.includes("houston") || r.slug.includes("leboncoin") || r.slug.includes("facebook-marketplace"));
  console.log("\nTarget articles:");
  houston.forEach((r) => console.log(r.slug, r.category, "\n ", r.coverImage?.slice(0, 120)));

  await prisma.$disconnect();
}
main();
