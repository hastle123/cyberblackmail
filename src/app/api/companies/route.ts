import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parsePagination, paginationMeta, enforceRateLimit } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    const limited = enforceRateLimit(request, "companies");
    if (limited) return limited;

    const { searchParams } = request.nextUrl;
    const { page, limit, skip } = parsePagination(searchParams);
    const search = searchParams.get("search")?.trim();
    const industry = searchParams.get("industry")?.trim();

    const where: Prisma.CompanyWhereInput = {
      ...(industry ? { industry: { contains: industry } } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { industry: { contains: search } },
              { headquarters: { contains: search } },
            ],
          }
        : {}),
    };

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        skip,
        take: limit,
        orderBy: { intelligenceScore: "desc" },
        select: {
          id: true,
          slug: true,
          name: true,
          industry: true,
          headquarters: true,
          logoUrl: true,
          intelligenceScore: true,
          _count: { select: { incidents: true, breaches: true, articles: true } },
        },
      }),
      prisma.company.count({ where }),
    ]);

    return apiSuccess(companies, paginationMeta(total, page, limit));
  } catch (error) {
    console.error("[GET /api/companies]", error);
    return apiError("Internal server error", 500);
  }
}
