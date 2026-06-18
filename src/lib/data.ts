import { prisma } from "./prisma";
import type { Severity, Category, Prisma } from "@prisma/client";

export async function getPlatformStats() {
  const [
    threatsTracked,
    breachesAnalyzed,
    countriesAffected,
    ransomwareAttacks,
    criticalAlerts,
    globalThreatLevel,
  ] = await Promise.all([
    prisma.article.count(),
    prisma.breach.count(),
    prisma.incident.findMany({ select: { country: true }, distinct: ["country"] }).then((r) => r.length),
    prisma.article.count({ where: { category: "RANSOMWARE" } }),
    prisma.alert.count({ where: { severity: "CRITICAL" } }),
    prisma.incident.aggregate({ _avg: { intelligenceScore: true } }),
  ]);

  return {
    threatsTracked,
    breachesAnalyzed,
    countriesAffected,
    ransomwareAttacks,
    criticalAlerts,
    globalThreatLevel: Math.round(globalThreatLevel._avg.intelligenceScore ?? 0),
  };
}

export async function getLatestAlerts(limit = 8) {
  return prisma.alert.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: { article: { select: { slug: true, title: true, titleRu: true } } },
  });
}

export async function getAllAlerts() {
  return prisma.alert.findMany({
    orderBy: { createdAt: "desc" },
    include: { article: { select: { slug: true, title: true, titleRu: true } } },
  });
}

export async function getRecentArticles(limit = 6) {
  return prisma.article.findMany({
    take: limit,
    orderBy: { publishedAt: "desc" },
    include: {
      actors: { include: { actor: { select: { name: true, slug: true } } } },
    },
  });
}

export async function getMapIncidents() {
  return prisma.incident.findMany({
    include: {
      article: { select: { slug: true, title: true, titleRu: true } },
      countryRef: { select: { code: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function getArticles(filters?: {
  category?: Category;
  severity?: Severity;
  limit?: number;
  skip?: number;
  search?: string;
}) {
  const where: Prisma.ArticleWhereInput = {};
  if (filters?.category) where.category = filters.category;
  if (filters?.severity) where.severity = filters.severity;
  if (filters?.search) {
    where.OR = [
      { title: { contains: filters.search } },
      { excerpt: { contains: filters.search } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.article.findMany({
      where,
      take: filters?.limit ?? 20,
      skip: filters?.skip ?? 0,
      orderBy: { publishedAt: "desc" },
      include: {
        actors: { include: { actor: { select: { name: true, slug: true } } } },
        companies: { include: { company: { select: { name: true, slug: true } } } },
      },
    }),
    prisma.article.count({ where }),
  ]);

  return { items, total };
}

export async function getArticleBySlug(slug: string) {
  return prisma.article.findUnique({
    where: { slug },
    include: {
      threatAnalysis: true,
      timeline: { orderBy: { order: "asc" } },
      iocs: { include: { ioc: true } },
      actors: { include: { actor: true } },
      companies: { include: { company: true } },
      cves: { include: { cve: true } },
      incident: true,
      breach: true,
    },
  });
}

export async function getActors() {
  return prisma.threatActor.findMany({
    orderBy: { intelligenceScore: "desc" },
    include: { _count: { select: { articles: true, campaigns: true } } },
  });
}

export async function getActorBySlug(slug: string) {
  return prisma.threatActor.findUnique({
    where: { slug },
    include: {
      articles: {
        include: { article: { select: { slug: true, title: true, titleRu: true, severity: true, publishedAt: true } } },
        take: 10,
      },
      campaigns: { include: { timeline: { orderBy: { order: "asc" } } } },
      countries: { include: { country: true } },
      cves: { include: { cve: true } },
      ransomware: true,
    },
  });
}

export async function getRansomwareGroups() {
  return prisma.ransomwareGroup.findMany({
    orderBy: { intelligenceScore: "desc" },
    include: { actor: { select: { slug: true, name: true } } },
  });
}

export async function getRansomwareBySlug(slug: string) {
  return prisma.ransomwareGroup.findUnique({
    where: { slug },
    include: { actor: true },
  });
}

export async function getBreaches(search?: string) {
  const where: Prisma.BreachWhereInput = search
    ? { organization: { contains: search } }
    : {};
  return prisma.breach.findMany({
    where,
    orderBy: { breachDate: "desc" },
    include: {
      company: { select: { slug: true, name: true } },
      article: { select: { slug: true, title: true, titleRu: true } },
    },
  });
}

export async function getIOCs(type?: string, search?: string) {
  const where: Prisma.IOCWhereInput = {};
  if (type) where.type = type as Prisma.EnumIOCTypeFilter["equals"];
  if (search) where.value = { contains: search };
  return prisma.iOC.findMany({
    where,
    orderBy: { lastSeen: "desc" },
    include: {
      _count: { select: { articles: true, incidents: true } },
    },
    take: 100,
  });
}

export async function getCompanies() {
  return prisma.company.findMany({
    orderBy: { intelligenceScore: "desc" },
    include: { _count: { select: { incidents: true, breaches: true, articles: true } } },
  });
}

export async function getCompanyBySlug(slug: string) {
  return prisma.company.findUnique({
    where: { slug },
    include: {
      incidents: { orderBy: { createdAt: "desc" }, take: 10 },
      breaches: { orderBy: { breachDate: "desc" }, take: 10 },
      articles: {
        include: { article: { select: { slug: true, title: true, titleRu: true, severity: true, publishedAt: true } } },
        take: 10,
      },
    },
  });
}

export async function getCountries() {
  return prisma.country.findMany({
    orderBy: { intelligenceScore: "desc" },
    include: {
      _count: { select: { incidents: true, actors: true } },
    },
  });
}

export async function getCountryByCode(code: string) {
  return prisma.country.findUnique({
    where: { code: code.toUpperCase() },
    include: {
      incidents: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { article: { select: { slug: true, title: true, titleRu: true } } },
      },
      actors: { include: { actor: { select: { slug: true, name: true, threatLevel: true } } } },
    },
  });
}

export async function getIndustries() {
  return prisma.industry.findMany({
    orderBy: { intelligenceScore: "desc" },
    include: {
      _count: { select: { breaches: true, incidents: true, campaigns: true } },
    },
  });
}

export async function getIndustryBySlug(slug: string) {
  return prisma.industry.findUnique({
    where: { slug },
    include: {
      breaches: { orderBy: { breachDate: "desc" }, take: 10 },
      incidents: { orderBy: { createdAt: "desc" }, take: 10 },
      campaigns: { include: { actor: { select: { slug: true, name: true } } } },
    },
  });
}

export async function getCVEs(severity?: Severity) {
  return prisma.cVE.findMany({
    where: severity ? { severity } : undefined,
    orderBy: { cvssScore: "desc" },
    include: { _count: { select: { articles: true } } },
  });
}

export async function getCVEById(cveId: string) {
  return prisma.cVE.findUnique({
    where: { cveId },
    include: {
      articles: { include: { article: { select: { slug: true, title: true, titleRu: true, severity: true } } } },
      actors: { include: { actor: { select: { slug: true, name: true } } } },
    },
  });
}

export async function getLatestBriefing() {
  return prisma.dailyBriefing.findFirst({ orderBy: { date: "desc" } });
}

export async function getBriefingByDate(date: string) {
  return prisma.dailyBriefing.findUnique({
    where: { date: new Date(date) },
  });
}

export async function getGraphData(center?: string, depth = 2) {
  const [actors, companies, breaches, iocs, countries, cves, incidents] = await Promise.all([
    prisma.threatActor.findMany({ take: 15, select: { id: true, slug: true, name: true, intelligenceScore: true } }),
    prisma.company.findMany({ take: 10, select: { id: true, slug: true, name: true, intelligenceScore: true } }),
    prisma.breach.findMany({ take: 10, select: { id: true, organization: true, intelligenceScore: true } }),
    prisma.iOC.findMany({ take: 15, select: { id: true, type: true, value: true, intelligenceScore: true } }),
    prisma.country.findMany({ take: 10, select: { id: true, code: true, name: true, intelligenceScore: true } }),
    prisma.cVE.findMany({ take: 10, select: { id: true, cveId: true, intelligenceScore: true, severity: true } }),
    prisma.incident.findMany({ take: 10, select: { id: true, country: true, type: true, intelligenceScore: true } }),
  ]);

  const nodes = [
    ...actors.map((a) => ({ id: `actor:${a.slug}`, label: a.name, type: "actor", score: a.intelligenceScore })),
    ...companies.map((c) => ({ id: `company:${c.slug}`, label: c.name, type: "company", score: c.intelligenceScore })),
    ...breaches.map((b) => ({ id: `breach:${b.id}`, label: b.organization, type: "breach", score: b.intelligenceScore })),
    ...iocs.map((i) => ({ id: `ioc:${i.id}`, label: i.value.slice(0, 24), type: "ioc", score: i.intelligenceScore })),
    ...countries.map((c) => ({ id: `country:${c.code}`, label: c.name, type: "country", score: c.intelligenceScore })),
    ...cves.map((c) => ({ id: `cve:${c.cveId}`, label: c.cveId, type: "cve", score: c.intelligenceScore })),
    ...incidents.map((i) => ({ id: `incident:${i.id}`, label: `${i.type} (${i.country})`, type: "incident", score: i.intelligenceScore })),
  ];

  const actorArticles = await prisma.threatActorOnArticle.findMany({
    take: 30,
    include: { actor: { select: { slug: true } }, article: { select: { slug: true, companies: { include: { company: { select: { slug: true } } } } } } },
  });

  const edges: { source: string; target: string; label: string }[] = [];
  for (const aa of actorArticles) {
    edges.push({ source: `actor:${aa.actor.slug}`, target: `incident:${aa.articleId}`, label: "attributed" });
    for (const co of aa.article.companies) {
      edges.push({ source: `actor:${aa.actor.slug}`, target: `company:${co.company.slug}`, label: "targeted" });
    }
  }

  return { nodes, edges };
}

export async function globalSearch(query: string) {
  const q = query.trim();
  if (!q) return { articles: [], iocs: [], actors: [], companies: [], breaches: [], cves: [], countries: [] };

  const [articles, iocs, actors, companies, breaches, cves, countries] = await Promise.all([
    prisma.article.findMany({
      where: { OR: [{ title: { contains: q } }, { excerpt: { contains: q } }] },
      take: 5,
      select: { slug: true, title: true, titleRu: true, excerpt: true, excerptRu: true, severity: true, category: true },
    }),
    prisma.iOC.findMany({
      where: { value: { contains: q } },
      take: 5,
      select: { id: true, type: true, value: true, threatLevel: true },
    }),
    prisma.threatActor.findMany({
      where: { name: { contains: q } },
      take: 5,
      select: { slug: true, name: true, threatLevel: true },
    }),
    prisma.company.findMany({
      where: { name: { contains: q } },
      take: 5,
      select: { slug: true, name: true, intelligenceScore: true },
    }),
    prisma.breach.findMany({
      where: { organization: { contains: q } },
      take: 5,
      select: { id: true, organization: true, severity: true },
    }),
    prisma.cVE.findMany({
      where: { OR: [{ cveId: { contains: q } }, { description: { contains: q } }] },
      take: 5,
      select: { cveId: true, severity: true, cvssScore: true },
    }),
    prisma.country.findMany({
      where: { OR: [{ name: { contains: q } }, { code: { contains: q } }] },
      take: 5,
      select: { code: true, name: true, intelligenceScore: true },
    }),
  ]);

  return { articles, iocs, actors, companies, breaches, cves, countries };
}

export async function getForumCategories() {
  return prisma.forumCategory.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      _count: {
        select: {
          topics: { where: { moderationStatus: "APPROVED" } },
        },
      },
    },
  });
}

export async function getForumCategoryBySlug(slug: string) {
  return prisma.forumCategory.findUnique({
    where: { slug },
    include: {
      _count: { select: { topics: true } },
    },
  });
}

export async function getForumTopics(filters?: { categorySlug?: string; limit?: number }) {
  const where = {
    moderationStatus: "APPROVED" as const,
    ...(filters?.categorySlug ? { category: { slug: filters.categorySlug } } : {}),
  };

  return prisma.forumTopic.findMany({
    where,
    take: filters?.limit ?? 50,
    orderBy: [{ isPinned: "desc" }, { lastReplyAt: "desc" }, { createdAt: "desc" }],
    include: {
      category: { select: { slug: true, name: true, nameRu: true } },
      _count: { select: { posts: { where: { moderationStatus: "APPROVED" } } } },
    },
  });
}

export async function getForumTopicBySlug(slug: string) {
  return prisma.forumTopic.findFirst({
    where: { slug, moderationStatus: "APPROVED" },
    include: {
      category: true,
      posts: {
        where: { moderationStatus: "APPROVED" },
        orderBy: { createdAt: "asc" },
      },
      _count: { select: { posts: { where: { moderationStatus: "APPROVED" } } } },
    },
  });
}

export async function incrementForumTopicViews(id: string) {
  return prisma.forumTopic.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  });
}
