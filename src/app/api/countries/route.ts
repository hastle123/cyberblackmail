import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parsePagination, paginationMeta, enforceRateLimit } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    const limited = enforceRateLimit(request, "countries");
    if (limited) return limited;

    const { searchParams } = request.nextUrl;
    const { page, limit, skip } = parsePagination(searchParams);
    const search = searchParams.get("search")?.trim();
    const region = searchParams.get("region")?.trim();

    const where: Prisma.CountryWhereInput = {
      ...(region ? { region: { contains: region } } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { code: { contains: search } },
            ],
          }
        : {}),
    };

    const [countries, total] = await Promise.all([
      prisma.country.findMany({
        where,
        skip,
        take: limit,
        orderBy: { intelligenceScore: "desc" },
        select: {
          id: true,
          code: true,
          name: true,
          region: true,
          intelligenceScore: true,
          _count: { select: { incidents: true, actors: true } },
        },
      }),
      prisma.country.count({ where }),
    ]);

    return apiSuccess(
      countries.map(({ _count, ...country }) => ({
        ...country,
        incidentCount: _count.incidents,
        actorCount: _count.actors,
      })),
      paginationMeta(total, page, limit)
    );
  } catch (error) {
    console.error("[GET /api/countries]", error);
    return apiError("Internal server error", 500);
  }
}
