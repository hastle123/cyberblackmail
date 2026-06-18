import { NextRequest } from "next/server";
import { GroupStatus } from "@prisma/client";
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
  status: z.nativeEnum(GroupStatus).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const limited = enforceRateLimit(request, "ransomware");
    if (limited) return limited;

    const { searchParams } = request.nextUrl;
    const { page, limit, skip } = parsePagination(searchParams);
    const search = searchParams.get("search")?.trim();

    const parsed = validateQuery(querySchema, {
      status: searchParams.get("status") ?? undefined,
    });
    if (parsed instanceof Response) return parsed;

    const where = {
      ...(parsed.status ? { status: parsed.status } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { description: { contains: search } },
            ],
          }
        : {}),
    };

    const [groups, total] = await Promise.all([
      prisma.ransomwareGroup.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ victimCount: "desc" }, { lastSeen: "desc" }],
        include: {
          actor: { select: { id: true, slug: true, name: true, type: true, threatLevel: true } },
        },
      }),
      prisma.ransomwareGroup.count({ where }),
    ]);

    return apiSuccess(groups, paginationMeta(total, page, limit));
  } catch (error) {
    console.error("[GET /api/ransomware]", error);
    return apiError("Internal server error", 500);
  }
}
