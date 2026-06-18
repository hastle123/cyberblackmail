import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, enforceRateLimit } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    const limited = enforceRateLimit(request, "briefing");
    if (limited) return limited;

    const briefing = await prisma.dailyBriefing.findFirst({
      orderBy: { date: "desc" },
    });

    if (!briefing) return apiError("No briefing available", 404);

    return apiSuccess(briefing);
  } catch (error) {
    console.error("[GET /api/briefing]", error);
    return apiError("Internal server error", 500);
  }
}
