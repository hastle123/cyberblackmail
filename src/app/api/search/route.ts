import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  apiSuccess,
  apiError,
  parsePagination,
  paginationMeta,
  validateQuery,
  enforceRateLimit,
} from "@/lib/api";

const querySchema = z.object({
  q: z.string().min(1, "Search query is required"),
});

const RESULT_LIMIT = 5;

export async function GET(request: NextRequest) {
  try {
    const limited = enforceRateLimit(request, "search");
    if (limited) return limited;

    const { searchParams } = request.nextUrl;
    const { page, limit } = parsePagination(searchParams);

    const parsed = validateQuery(querySchema, {
      q: searchParams.get("q") ?? "",
    });
    if (parsed instanceof Response) return parsed;

    const q = parsed.q.trim();
    const perEntityTake = Math.min(limit, RESULT_LIMIT);

    const [articles, companies, actors, iocs, cves, breaches, ransomwareGroups] =
      await Promise.all([
        prisma.article.findMany({
          where: {
            OR: [
              { title: { contains: q } },
              { excerpt: { contains: q } },
              { content: { contains: q } },
            ],
          },
          take: perEntityTake,
          orderBy: { publishedAt: "desc" },
          select: {
            id: true,
            slug: true,
            title: true,
            titleRu: true,
            excerpt: true,
            severity: true,
            category: true,
            publishedAt: true,
          },
        }),
        prisma.company.findMany({
          where: {
            OR: [
              { name: { contains: q } },
              { industry: { contains: q } },
            ],
          },
          take: perEntityTake,
          select: { id: true, slug: true, name: true, industry: true, intelligenceScore: true },
        }),
        prisma.threatActor.findMany({
          where: {
            OR: [
              { name: { contains: q } },
              { description: { contains: q } },
            ],
          },
          take: perEntityTake,
          select: { id: true, slug: true, name: true, type: true, threatLevel: true },
        }),
        prisma.iOC.findMany({
          where: { value: { contains: q } },
          take: perEntityTake,
          select: { id: true, type: true, value: true, threatLevel: true },
        }),
        prisma.cVE.findMany({
          where: {
            OR: [
              { cveId: { contains: q } },
              { description: { contains: q } },
            ],
          },
          take: perEntityTake,
          select: { id: true, cveId: true, severity: true, cvssScore: true },
        }),
        prisma.breach.findMany({
          where: {
            OR: [
              { organization: { contains: q } },
              { industry: { contains: q } },
            ],
          },
          take: perEntityTake,
          orderBy: { breachDate: "desc" },
          select: {
            id: true,
            organization: true,
            recordsExposed: true,
            severity: true,
            breachDate: true,
          },
        }),
        prisma.ransomwareGroup.findMany({
          where: {
            OR: [
              { name: { contains: q } },
              { description: { contains: q } },
            ],
          },
          take: perEntityTake,
          select: { id: true, slug: true, name: true, status: true, victimCount: true },
        }),
      ]);

    const results = {
      articles,
      companies,
      actors,
      iocs,
      cves,
      breaches,
      ransomwareGroups,
    };

    const total = Object.values(results).reduce((sum, items) => sum + items.length, 0);

    return apiSuccess(results, paginationMeta(total, page, limit));
  } catch (error) {
    console.error("[GET /api/search]", error);
    return apiError("Internal server error", 500);
  }
}
