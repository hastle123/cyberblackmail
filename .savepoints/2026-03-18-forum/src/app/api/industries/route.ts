import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parsePagination, paginationMeta, enforceRateLimit } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    const limited = enforceRateLimit(request, "industries");
    if (limited) return limited;

    const { searchParams } = request.nextUrl;
    const { page, limit, skip } = parsePagination(searchParams);
    const search = searchParams.get("search")?.trim();

    const where: Prisma.IndustryWhereInput = search
      ? {
          OR: [
            { name: { contains: search } },
            { description: { contains: search } },
          ],
        }
      : {};

    const [industries, total] = await Promise.all([
      prisma.industry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { intelligenceScore: "desc" },
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          intelligenceScore: true,
          _count: { select: { breaches: true, incidents: true, campaigns: true } },
        },
      }),
      prisma.industry.count({ where }),
    ]);

    return apiSuccess(
      industries.map(({ _count, ...industry }) => ({
        ...industry,
        breachCount: _count.breaches,
        incidentCount: _count.incidents,
        campaignCount: _count.campaigns,
      })),
      paginationMeta(total, page, limit)
    );
  } catch (error) {
    console.error("[GET /api/industries]", error);
    return apiError("Internal server error", 500);
  }
}
