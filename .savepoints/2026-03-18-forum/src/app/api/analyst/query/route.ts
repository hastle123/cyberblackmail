import { NextRequest } from "next/server";
import { Category } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, validateQuery, enforceRateLimit } from "@/lib/api";

const bodySchema = z.object({
  query: z.string().min(1, "Query is required"),
});

type KeywordMapping = {
  industry?: string;
  category?: Category;
  companySearch?: string;
};

const KEYWORD_MAPPINGS: Record<string, KeywordMapping> = {
  healthcare: { industry: "Healthcare" },
  hospital: { industry: "Healthcare" },
  ransomware: { category: Category.RANSOMWARE },
  microsoft: { companySearch: "Microsoft" },
  finance: { industry: "Financial Services" },
  banking: { industry: "Financial Services" },
  apt: { category: Category.APT },
  "zero-day": { category: Category.ZERO_DAY },
  "zero day": { category: Category.ZERO_DAY },
  breach: { category: Category.BREAKING_BREACH },
  darknet: { category: Category.DARKNET },
};

function resolveKeywordMappings(query: string): KeywordMapping {
  const lower = query.toLowerCase();
  const merged: KeywordMapping = {};

  for (const [keyword, mapping] of Object.entries(KEYWORD_MAPPINGS)) {
    if (lower.includes(keyword)) {
      if (mapping.industry) merged.industry = mapping.industry;
      if (mapping.category) merged.category = mapping.category;
      if (mapping.companySearch) merged.companySearch = mapping.companySearch;
    }
  }

  return merged;
}

function extractKeywords(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[\s,;.!?]+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 2);
}

export async function POST(request: NextRequest) {
  try {
    const limited = enforceRateLimit(request, "analyst-query");
    if (limited) return limited;

    const body = await request.json();
    const parsed = validateQuery(bodySchema, body);
    if (parsed instanceof Response) return parsed;

    const { query } = parsed;
    const mappings = resolveKeywordMappings(query);
    const keywords = extractKeywords(query);

    const articleWhere = {
      AND: [
        mappings.category ? { category: mappings.category } : {},
        keywords.length > 0
          ? {
              OR: keywords.flatMap((keyword) => [
                { title: { contains: keyword } },
                { excerpt: { contains: keyword } },
                { content: { contains: keyword } },
              ]),
            }
          : {
              OR: [
                { title: { contains: query } },
                { excerpt: { contains: query } },
              ],
            },
        mappings.industry
          ? {
              OR: [
                { threatAnalysis: { targetIndustry: { contains: mappings.industry } } },
                { companies: { some: { company: { industry: { contains: mappings.industry } } } } },
              ],
            }
          : {},
        mappings.companySearch
          ? { companies: { some: { company: { name: { contains: mappings.companySearch } } } } }
          : {},
      ],
    };

    const [articles, companies, actors, iocs, breaches] = await Promise.all([
      prisma.article.findMany({
        where: articleWhere,
        take: 10,
        orderBy: { publishedAt: "desc" },
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          severity: true,
          category: true,
          publishedAt: true,
        },
      }),
      prisma.company.findMany({
        where: {
          OR: [
            ...(mappings.companySearch
              ? [{ name: { contains: mappings.companySearch } }]
              : []),
            ...(mappings.industry
              ? [{ industry: { contains: mappings.industry } }]
              : []),
            ...keywords.map((keyword) => ({
              name: { contains: keyword },
            })),
          ],
        },
        take: 5,
        select: { id: true, slug: true, name: true, industry: true },
      }),
      prisma.threatActor.findMany({
        where: {
          OR: keywords.flatMap((keyword) => [
            { name: { contains: keyword } },
            { description: { contains: keyword } },
          ]),
        },
        take: 5,
        select: { id: true, slug: true, name: true, type: true, threatLevel: true },
      }),
      prisma.iOC.findMany({
        where: {
          OR: keywords.map((keyword) => ({
            value: { contains: keyword },
          })),
        },
        take: 5,
        select: { id: true, type: true, value: true, threatLevel: true },
      }),
      prisma.breach.findMany({
        where: {
          AND: [
            mappings.industry
              ? { industry: { contains: mappings.industry } }
              : {},
            keywords.length > 0
              ? {
                  OR: keywords.map((keyword) => ({
                    organization: { contains: keyword },
                  })),
                }
              : {},
          ],
        },
        take: 5,
        orderBy: { breachDate: "desc" },
        select: { id: true, organization: true, severity: true, breachDate: true },
      }),
    ]);

    const interpretation = {
      originalQuery: query,
      detectedMappings: mappings,
      keywords,
      summary: buildSummary(articles.length, companies.length, actors.length, mappings),
    };

    return apiSuccess({
      interpretation,
      results: { articles, companies, actors, iocs, breaches },
    });
  } catch (error) {
    console.error("[POST /api/analyst/query]", error);
    return apiError("Internal server error", 500);
  }
}

function buildSummary(
  articleCount: number,
  companyCount: number,
  actorCount: number,
  mappings: KeywordMapping
): string {
  const parts: string[] = [];

  if (mappings.industry) parts.push(`industry: ${mappings.industry}`);
  if (mappings.category) parts.push(`category: ${mappings.category}`);
  if (mappings.companySearch) parts.push(`company: ${mappings.companySearch}`);

  const filters = parts.length > 0 ? ` (${parts.join(", ")})` : "";
  return `Found ${articleCount} articles, ${companyCount} companies, and ${actorCount} threat actors${filters}.`;
}
