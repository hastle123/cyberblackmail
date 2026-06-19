import { config } from "dotenv";
config();

import { prisma } from "@/lib/prisma";
import { geolocateIncident, incidentTypeFromCategory } from "@/lib/ingest/geolocate";

async function main() {
  const articles = await prisma.article.findMany({
    where: { incident: null },
    orderBy: { publishedAt: "desc" },
    take: 200,
  });

  let created = 0;
  for (const article of articles) {
    const geo = geolocateIncident(`${article.title} ${article.excerpt}`, article.slug);
    const countryRef = await prisma.country.findUnique({
      where: { code: geo.countryCode },
      select: { id: true },
    });

    await prisma.incident.create({
      data: {
        lat: geo.lat,
        lng: geo.lng,
        country: geo.country,
        city: geo.city,
        type: incidentTypeFromCategory(article.category),
        severity: article.severity,
        intelligenceScore: article.intelligenceScore,
        articleId: article.id,
        countryId: countryRef?.id,
        createdAt: article.publishedAt,
      },
    });
    created++;
  }

  console.log(`Backfilled ${created} map incidents from articles.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
