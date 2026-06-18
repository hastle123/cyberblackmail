import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, enforceRateLimit } from "@/lib/api";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const limited = enforceRateLimit(request, "ransomware-slug");
    if (limited) return limited;

    const { slug } = await context.params;

    const group = await prisma.ransomwareGroup.findUnique({
      where: { slug },
      include: {
        actor: {
          include: {
            campaigns: {
              orderBy: { startDate: "desc" },
              take: 10,
              include: { industry: { select: { id: true, slug: true, name: true } } },
            },
            articles: {
              take: 10,
              include: {
                article: {
                  select: {
                    id: true,
                    slug: true,
                    title: true,
                    severity: true,
                    publishedAt: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!group) return apiError("Ransomware group not found", 404);

    return apiSuccess({
      ...group,
      actor: group.actor
        ? {
            ...group.actor,
            articles: group.actor.articles.map(({ article }) => article),
          }
        : null,
    });
  } catch (error) {
    console.error("[GET /api/ransomware/[slug]]", error);
    return apiError("Internal server error", 500);
  }
}
