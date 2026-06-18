import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, enforceRateLimit } from "@/lib/api";

type RouteContext = { params: Promise<{ cveId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const limited = enforceRateLimit(request, "vulnerabilities-cveId");
    if (limited) return limited;

    const { cveId } = await context.params;

    const cve = await prisma.cVE.findUnique({
      where: { cveId: cveId.toUpperCase() },
      include: {
        articles: {
          include: {
            article: {
              select: {
                id: true,
                slug: true,
                title: true,
                severity: true,
                category: true,
                publishedAt: true,
              },
            },
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
              },
            },
          },
        },
      },
    });

    if (!cve) return apiError("CVE not found", 404);

    return apiSuccess({
      ...cve,
      articles: cve.articles.map(({ article }) => article),
      actors: cve.actors.map(({ actor }) => actor),
    });
  } catch (error) {
    console.error("[GET /api/vulnerabilities/[cveId]]", error);
    return apiError("Internal server error", 500);
  }
}
