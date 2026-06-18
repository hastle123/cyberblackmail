import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, enforceRateLimit } from "@/lib/api";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const limited = enforceRateLimit(request, "industries-slug");
    if (limited) return limited;

    const { slug } = await context.params;

    const industry = await prisma.industry.findUnique({
      where: { slug },
      include: {
        breaches: { orderBy: { breachDate: "desc" }, take: 20 },
        incidents: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: {
            company: { select: { id: true, slug: true, name: true } },
            countryRef: { select: { id: true, code: true, name: true } },
          },
        },
        campaigns: {
          orderBy: { startDate: "desc" },
          include: {
            actor: { select: { id: true, slug: true, name: true, type: true } },
          },
        },
        _count: { select: { breaches: true, incidents: true, campaigns: true } },
      },
    });

    if (!industry) return apiError("Industry not found", 404);

    const { _count, ...rest } = industry;

    return apiSuccess({
      ...rest,
      breachCount: _count.breaches,
      incidentCount: _count.incidents,
      campaignCount: _count.campaigns,
    });
  } catch (error) {
    console.error("[GET /api/industries/[slug]]", error);
    return apiError("Internal server error", 500);
  }
}
