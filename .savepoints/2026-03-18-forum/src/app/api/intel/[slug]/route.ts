import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, enforceRateLimit } from "@/lib/api";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const limited = enforceRateLimit(request, "intel-slug");
    if (limited) return limited;

    const { slug } = await context.params;

    const article = await prisma.article.findUnique({
      where: { slug },
      include: {
        threatAnalysis: true,
        timeline: { orderBy: { order: "asc" } },
        iocs: { include: { ioc: true } },
        actors: { include: { actor: true } },
        companies: { include: { company: true } },
      },
    });

    if (!article) return apiError("Article not found", 404);

    return apiSuccess({
      ...article,
      iocs: article.iocs.map(({ ioc }) => ioc),
      actors: article.actors.map(({ actor }) => actor),
      companies: article.companies.map(({ company }) => company),
    });
  } catch (error) {
    console.error("[GET /api/intel/[slug]]", error);
    return apiError("Internal server error", 500);
  }
}
