import { NextRequest } from "next/server";
import { Severity } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, validateQuery, enforceRateLimit } from "@/lib/api";

const querySchema = z.object({
  severity: z.nativeEnum(Severity).optional(),
  limit: z.coerce.number().int().min(1).max(1000).optional().default(500),
});

export async function GET(request: NextRequest) {
  try {
    const limited = enforceRateLimit(request, "threat-map");
    if (limited) return limited;

    const { searchParams } = request.nextUrl;

    const parsed = validateQuery(querySchema, {
      severity: searchParams.get("severity") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });
    if (parsed instanceof Response) return parsed;

    const incidents = await prisma.incident.findMany({
      where: parsed.severity ? { severity: parsed.severity } : undefined,
      take: parsed.limit,
      orderBy: { createdAt: "desc" },
      include: {
        company: { select: { id: true, slug: true, name: true } },
        countryRef: { select: { id: true, code: true, name: true } },
        industry: { select: { id: true, slug: true, name: true } },
      },
    });

    const features = incidents.map((incident) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [incident.lng, incident.lat] as [number, number],
      },
      properties: {
        id: incident.id,
        country: incident.country,
        city: incident.city,
        incidentType: incident.type,
        severity: incident.severity,
        intelligenceScore: incident.intelligenceScore,
        createdAt: incident.createdAt,
        company: incident.company,
        countryRef: incident.countryRef,
        industry: incident.industry,
      },
    }));

    return apiSuccess(features);
  } catch (error) {
    console.error("[GET /api/threat-map]", error);
    return apiError("Internal server error", 500);
  }
}
