import { NextRequest } from "next/server";
import { Prisma, Severity } from "@prisma/client";
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
    const limited = enforceRateLimit(request, "vulnerabilities");
    if (limited) return limited;

    const { searchParams } = request.nextUrl;
    const { page, limit, skip } = parsePagination(searchParams);
    const search = searchParams.get("search")?.trim();

    const parsed = validateQuery(querySchema, {
      severity: searchParams.get("severity") ?? undefined,
    });
    if (parsed instanceof Response) return parsed;

    const where: Prisma.CVEWhereInput = {
      ...(parsed.severity ? { severity: parsed.severity } : {}),
      ...(search
        ? {
            OR: [
              { cveId: { contains: search } },
              { description: { contains: search } },
            ],
          }
        : {}),
    };

    const [cves, total] = await Promise.all([
      prisma.cVE.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ cvssScore: "desc" }, { publishedAt: "desc" }],
        select: {
          id: true,
          cveId: true,
          cvssScore: true,
          severity: true,
          exploitationStatus: true,
          description: true,
          affectedVendors: true,
          intelligenceScore: true,
          publishedAt: true,
          _count: { select: { articles: true, actors: true } },
        },
      }),
      prisma.cVE.count({ where }),
    ]);

    return apiSuccess(cves, paginationMeta(total, page, limit));
  } catch (error) {
    console.error("[GET /api/vulnerabilities]", error);
    return apiError("Internal server error", 500);
  }
}
