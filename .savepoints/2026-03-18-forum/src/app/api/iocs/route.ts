import { NextRequest } from "next/server";
import { IOCType, Prisma } from "@prisma/client";
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
  type: z.nativeEnum(IOCType).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const limited = enforceRateLimit(request, "iocs");
    if (limited) return limited;

    const { searchParams } = request.nextUrl;
    const { page, limit, skip } = parsePagination(searchParams);
    const search = searchParams.get("search")?.trim();

    const parsed = validateQuery(querySchema, {
      type: searchParams.get("type") ?? undefined,
    });
    if (parsed instanceof Response) return parsed;

    const where: Prisma.IOCWhereInput = {};
    if (parsed.type) where.type = parsed.type;
    if (search) {
      where.value = { contains: search };
    }

    const [iocs, total] = await Promise.all([
      prisma.iOC.findMany({
        where,
        skip,
        take: limit,
        orderBy: { lastSeen: "desc" },
        select: {
          id: true,
          type: true,
          value: true,
          threatLevel: true,
          intelligenceScore: true,
          firstSeen: true,
          lastSeen: true,
          _count: { select: { articles: true, incidents: true } },
        },
      }),
      prisma.iOC.count({ where }),
    ]);

    return apiSuccess(iocs, paginationMeta(total, page, limit));
  } catch (error) {
    console.error("[GET /api/iocs]", error);
    return apiError("Internal server error", 500);
  }
}
