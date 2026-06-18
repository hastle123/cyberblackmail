import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parsePagination, paginationMeta, enforceRateLimit } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    const limited = enforceRateLimit(request, "breaches");
    if (limited) return limited;

    const { searchParams } = request.nextUrl;
    const { page, limit, skip } = parsePagination(searchParams);
    const search = searchParams.get("search")?.trim();

    const where: Prisma.BreachWhereInput = search
      ? {
          OR: [
            { organization: { contains: search } },
            { industry: { contains: search } },
          ],
        }
      : {};

    const [breaches, total] = await Promise.all([
      prisma.breach.findMany({
        where,
        skip,
        take: limit,
        orderBy: { breachDate: "desc" },
        include: {
          company: { select: { id: true, slug: true, name: true } },
          industryRef: { select: { id: true, slug: true, name: true } },
          article: { select: { id: true, slug: true, title: true } },
        },
      }),
      prisma.breach.count({ where }),
    ]);

    return apiSuccess(breaches, paginationMeta(total, page, limit));
  } catch (error) {
    console.error("[GET /api/breaches]", error);
    return apiError("Internal server error", 500);
  }
}
