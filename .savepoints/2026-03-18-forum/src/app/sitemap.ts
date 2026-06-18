import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { routing } from "@/i18n/routing";

export const dynamic = "force-dynamic";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cyberblackmail.com";

const STATIC_PATHS = [
  "",
  "/threat-map",
  "/alerts",
  "/iocs",
  "/companies",
  "/countries",
  "/industries",
  "/vulnerabilities",
  "/actors",
  "/ransomware",
  "/darknet",
  "/breaches",
  "/intel",
  "/briefing",
  "/search",
  "/about",
  "/contact",
  "/forum",
];

function localePath(locale: string, path: string) {
  if (locale === routing.defaultLocale) return path || "/";
  return path ? `/${locale}${path}` : `/${locale}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, actors, companies, countries, industries, cves, ransomware, forumTopics] = await Promise.all([
    prisma.article.findMany({ select: { slug: true, updatedAt: true } }),
    prisma.threatActor.findMany({ select: { slug: true, createdAt: true } }),
    prisma.company.findMany({ select: { slug: true, createdAt: true } }),
    prisma.country.findMany({ select: { code: true } }),
    prisma.industry.findMany({ select: { slug: true } }),
    prisma.cVE.findMany({ select: { cveId: true, publishedAt: true } }),
    prisma.ransomwareGroup.findMany({ select: { slug: true, lastSeen: true } }),
    prisma.forumTopic.findMany({ select: { slug: true, updatedAt: true } }),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = routing.locales.flatMap((locale) =>
    STATIC_PATHS.map((path) => ({
      url: `${BASE_URL}${localePath(locale, path)}`,
      lastModified: new Date(),
      changeFrequency: path === "" ? ("hourly" as const) : ("daily" as const),
      priority: path === "" ? 1 : 0.8,
    })),
  );

  const dynamicRoutes = (locale: string): MetadataRoute.Sitemap => [
    ...articles.map((a) => ({
      url: `${BASE_URL}${localePath(locale, `/intel/${a.slug}`)}`,
      lastModified: a.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...actors.map((a) => ({
      url: `${BASE_URL}${localePath(locale, `/actors/${a.slug}`)}`,
      lastModified: a.createdAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...companies.map((c) => ({
      url: `${BASE_URL}${localePath(locale, `/companies/${c.slug}`)}`,
      lastModified: c.createdAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...countries.map((c) => ({
      url: `${BASE_URL}${localePath(locale, `/countries/${c.code}`)}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
    ...industries.map((i) => ({
      url: `${BASE_URL}${localePath(locale, `/industries/${i.slug}`)}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
    ...cves.map((c) => ({
      url: `${BASE_URL}${localePath(locale, `/vulnerabilities/${c.cveId}`)}`,
      lastModified: c.publishedAt,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    ...ransomware.map((r) => ({
      url: `${BASE_URL}${localePath(locale, `/ransomware/${r.slug}`)}`,
      lastModified: r.lastSeen,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...forumTopics.map((t) => ({
      url: `${BASE_URL}${localePath(locale, `/forum/${t.slug}`)}`,
      lastModified: t.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.55,
    })),
  ];

  return [
    ...staticRoutes,
    ...routing.locales.flatMap((locale) => dynamicRoutes(locale)),
  ];
}
