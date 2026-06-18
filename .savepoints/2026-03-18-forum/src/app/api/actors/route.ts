import { NextRequest } from "next/server";
import { ActorType, Prisma, Severity } from "@prisma/client";
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
  type: z.nativeEnum(ActorType).optional(),
  threatLevel: z.nativeEnum(Severity).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const limited = enforceRateLimit(request, "actors");
    if (limited) return limited;

    const { searchParams } = request.nextUrl;
    const { page, limit, skip } = parsePagination(searchParams);
    const search = searchParams.get("search")?.trim();

    const parsed = validateQuery(querySchema, {
      type: searchParams.get("type") ?? undefined,
      threatLevel: searchParams.get("threatLevel") ?? undefined,
    });
    if (parsed instanceof Response) return parsed;

    const where: Prisma.ThreatActorWhereInput = {
      ...(parsed.type ? { type: parsed.type } : {}),
      ...(parsed.threatLevel ? { threatLevel: parsed.threatLevel } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { description: { contains: search } },
            ],
          }
        : {}),
    };

    const [actors, total] = await Promise.all([
      prisma.threatActor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { intelligenceScore: "desc" },
        select: {
          id: true,
          slug: true,
          name: true,
          aliases: true,
          type: true,
          origin: true,
          threatLevel: true,
          intelligenceScore: true,
          targetSectors: true,
          _count: { select: { campaigns: true, articles: true } },
        },
      }),
      prisma.threatActor.count({ where }),
    ]);

    return apiSuccess(actors, paginationMeta(total, page, limit));
  } catch (error) {
    console.error("[GET /api/actors]", error);
    return apiError("Internal server error", 500);
  }
}
