import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, enforceRateLimit } from "@/lib/api";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const limited = enforceRateLimit(request, "actors-slug");
    if (limited) return limited;

    const { slug } = await context.params;

    const actor = await prisma.threatActor.findUnique({
      where: { slug },
      include: {
        campaigns: {
          orderBy: { startDate: "desc" },
          include: { industry: { select: { id: true, slug: true, name: true } } },
        },
        articles: {
          include: {
            article: {
              select: {
                id: true,
                slug: true,
                title: true,
                excerpt: true,
                severity: true,
                category: true,
                publishedAt: true,
              },
            },
          },
        },
        countries: { include: { country: true } },
        ransomware: true,
        cves: { include: { cve: true } },
      },
    });

    if (!actor) return apiError("Threat actor not found", 404);

    return apiSuccess({
      ...actor,
      articles: actor.articles.map(({ article }) => article),
      countries: actor.countries.map(({ country }) => country),
      cves: actor.cves.map(({ cve }) => cve),
    });
  } catch (error) {
    console.error("[GET /api/actors/[slug]]", error);
    return apiError("Internal server error", 500);
  }
}
