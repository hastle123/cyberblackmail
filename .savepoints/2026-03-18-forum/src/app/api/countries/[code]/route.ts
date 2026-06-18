import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, enforceRateLimit } from "@/lib/api";

type RouteContext = { params: Promise<{ code: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const limited = enforceRateLimit(request, "countries-code");
    if (limited) return limited;

    const { code } = await context.params;

    const country = await prisma.country.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        incidents: {
          orderBy: { createdAt: "desc" },
          take: 50,
          include: {
            company: { select: { id: true, slug: true, name: true } },
            industry: { select: { id: true, slug: true, name: true } },
          },
        },
        actors: {
          include: {
            actor: {
              select: {
                id: true,
                slug: true,
                name: true,
                type: true,
                threatLevel: true,
                intelligenceScore: true,
              },
            },
          },
        },
        _count: { select: { incidents: true, actors: true } },
      },
    });

    if (!country) return apiError("Country not found", 404);

    const { _count, actors, ...rest } = country;

    return apiSuccess({
      ...rest,
      incidentCount: _count.incidents,
      actorCount: _count.actors,
      actors: actors.map(({ actor }) => actor),
    });
  } catch (error) {
    console.error("[GET /api/countries/[code]]", error);
    return apiError("Internal server error", 500);
  }
}
