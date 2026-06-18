import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, enforceRateLimit } from "@/lib/api";

type RouteContext = { params: Promise<{ date: string }> };

function parseBriefingDate(dateStr: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const limited = enforceRateLimit(request, "briefing-date");
    if (limited) return limited;

    const { date: dateParam } = await context.params;
    const date = parseBriefingDate(dateParam);

    if (!date) return apiError("Invalid date format. Use YYYY-MM-DD", 422);

    const briefing = await prisma.dailyBriefing.findUnique({
      where: { date },
    });

    if (!briefing) return apiError("Briefing not found for this date", 404);

    return apiSuccess(briefing);
  } catch (error) {
    console.error("[GET /api/briefing/[date]]", error);
    return apiError("Internal server error", 500);
  }
}
