import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, enforceRateLimit } from "@/lib/api";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const limited = enforceRateLimit(request, "iocs-id");
    if (limited) return limited;

    const { id } = await context.params;

    const ioc = await prisma.iOC.findUnique({
      where: { id },
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
        incidents: {
          include: {
            incident: {
              select: {
                id: true,
                type: true,
                severity: true,
                country: true,
                city: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!ioc) return apiError("IOC not found", 404);

    return apiSuccess({
      ...ioc,
      articles: ioc.articles.map(({ article }) => article),
      incidents: ioc.incidents.map(({ incident }) => incident),
    });
  } catch (error) {
    console.error("[GET /api/iocs/[id]]", error);
    return apiError("Internal server error", 500);
  }
}
