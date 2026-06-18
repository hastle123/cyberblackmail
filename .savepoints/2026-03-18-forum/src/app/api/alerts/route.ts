import { NextRequest } from "next/server";
import { Severity } from "@prisma/client";
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
});

export async function GET(request: NextRequest) {
  try {
    const limited = enforceRateLimit(request, "alerts");
    if (limited) return limited;

    const { searchParams } = request.nextUrl;
    const { page, limit, skip } = parsePagination(searchParams);

    const parsed = validateQuery(querySchema, {
      severity: searchParams.get("severity") ?? undefined,
    });
    if (parsed instanceof Response) return parsed;

    const where = parsed.severity ? { severity: parsed.severity } : {};

    const [alerts, total] = await Promise.all([
      prisma.alert.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          article: {
            select: { id: true, slug: true, title: true, severity: true, category: true },
          },
        },
      }),
      prisma.alert.count({ where }),
    ]);

    return apiSuccess(alerts, paginationMeta(total, page, limit));
  } catch (error) {
    console.error("[GET /api/alerts]", error);
    return apiError("Internal server error", 500);
  }
}
