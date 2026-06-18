import { NextRequest } from "next/server";
import { Category, Prisma, Severity } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  apiSuccess,
  apiError,
  parsePagination,
  paginationMeta,
  validateQuery,
  enforceRateLimit,
} from "@/lib/api";

const querySchema = z.object({
  severity: z.nativeEnum(Severity).optional(),
  category: z.nativeEnum(Category).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const limited = enforceRateLimit(request, "intel");
    if (limited) return limited;

    const { searchParams } = request.nextUrl;
    const { page, limit, skip } = parsePagination(searchParams);

    const parsed = validateQuery(querySchema, {
      severity: searchParams.get("severity") ?? undefined,
      category: searchParams.get("category") ?? undefined,
    });
    if (parsed instanceof Response) return parsed;

    const where: Prisma.ArticleWhereInput = {};
    if (parsed.severity) where.severity = parsed.severity;
    if (parsed.category) where.category = parsed.category;

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        skip,
        take: limit,
        orderBy: { publishedAt: "desc" },
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          coverImage: true,
          severity: true,
          category: true,
          intelligenceScore: true,
          source: true,
          readTime: true,
          publishedAt: true,
        },
      }),
      prisma.article.count({ where }),
    ]);

    return apiSuccess(articles, paginationMeta(total, page, limit));
  } catch (error) {
    console.error("[GET /api/intel]", error);
    return apiError("Internal server error", 500);
  }
}
