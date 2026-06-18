import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, enforceRateLimit } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    const limited = enforceRateLimit(request, "stats");
    if (limited) return limited;

    const [
      articleCount,
      breachCount,
      alertCount,
      iocCount,
      actorCount,
      companyCount,
      cveCount,
      incidentCount,
      ransomwareCount,
      countryCount,
      industryCount,
      criticalAlerts,
      recentArticles,
      severityBreakdown,
    ] = await Promise.all([
      prisma.article.count(),
      prisma.breach.count(),
      prisma.alert.count(),
      prisma.iOC.count(),
      prisma.threatActor.count(),
      prisma.company.count(),
      prisma.cVE.count(),
      prisma.incident.count(),
      prisma.ransomwareGroup.count(),
      prisma.country.count(),
      prisma.industry.count(),
      prisma.alert.count({ where: { severity: "CRITICAL" } }),
      prisma.article.findMany({
        take: 5,
        orderBy: { publishedAt: "desc" },
        select: { id: true, slug: true, title: true, severity: true, publishedAt: true },
      }),
      prisma.article.groupBy({
        by: ["severity"],
        _count: { severity: true },
      }),
    ]);

    return apiSuccess({
      totals: {
        articles: articleCount,
        breaches: breachCount,
        alerts: alertCount,
        iocs: iocCount,
        actors: actorCount,
        companies: companyCount,
        cves: cveCount,
        incidents: incidentCount,
        ransomwareGroups: ransomwareCount,
        countries: countryCount,
        industries: industryCount,
      },
      criticalAlerts,
      recentArticles,
      severityBreakdown: severityBreakdown.map(({ severity, _count }) => ({
        severity,
        count: _count.severity,
      })),
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[GET /api/stats]", error);
    return apiError("Internal server error", 500);
  }
}
