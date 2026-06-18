import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, enforceRateLimit } from "@/lib/api";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const limited = enforceRateLimit(request, "companies-slug");
    if (limited) return limited;

    const { slug } = await context.params;

    const company = await prisma.company.findUnique({
      where: { slug },
      include: {
        incidents: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            type: true,
            severity: true,
            country: true,
            city: true,
            lat: true,
            lng: true,
            createdAt: true,
          },
        },
        breaches: { orderBy: { breachDate: "desc" } },
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
      },
    });

    if (!company) return apiError("Company not found", 404);

    return apiSuccess({
      ...company,
      articles: company.articles.map(({ article }) => article),
    });
  } catch (error) {
    console.error("[GET /api/companies/[slug]]", error);
    return apiError("Internal server error", 500);
  }
}
