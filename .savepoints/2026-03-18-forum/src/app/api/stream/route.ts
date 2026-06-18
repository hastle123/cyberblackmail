import { prisma } from "@/lib/prisma";
import { apiError, enforceRateLimit } from "@/lib/api";

export const dynamic = "force-dynamic";

async function fetchStats() {
  const [
    articleCount,
    breachCount,
    alertCount,
    iocCount,
    actorCount,
    incidentCount,
    criticalAlerts,
    recentAlerts,
  ] = await Promise.all([
    prisma.article.count(),
    prisma.breach.count(),
    prisma.alert.count(),
    prisma.iOC.count(),
    prisma.threatActor.count(),
    prisma.incident.count(),
    prisma.alert.count({ where: { severity: "CRITICAL" } }),
    prisma.alert.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        article: { select: { id: true, slug: true, title: true, severity: true } },
      },
    }),
  ]);

  return {
    totals: {
      articles: articleCount,
      breaches: breachCount,
      alerts: alertCount,
      iocs: iocCount,
      actors: actorCount,
      incidents: incidentCount,
    },
    criticalAlerts,
    recentAlerts,
    generatedAt: new Date().toISOString(),
  };
}

export async function GET(request: Request) {
  try {
    const limited = enforceRateLimit(request, "stream");
    if (limited) return limited;

    const encoder = new TextEncoder();
    let lastAlertSeenAt = new Date();
    let closed = false;

    const stream = new ReadableStream({
      start(controller) {
        const send = (event: string, payload: unknown) => {
          if (closed) return;
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`)
          );
        };

        const poll = async () => {
          while (!closed) {
            try {
              const [stats, newAlerts] = await Promise.all([
                fetchStats(),
                prisma.alert.findMany({
                  where: { createdAt: { gt: lastAlertSeenAt } },
                  orderBy: { createdAt: "asc" },
                  take: 50,
                  include: {
                    article: {
                      select: { id: true, slug: true, title: true, severity: true },
                    },
                  },
                }),
              ]);

              send("update", { data: { stats, newAlerts }, meta: null, error: null });

              if (newAlerts.length > 0) {
                lastAlertSeenAt = newAlerts[newAlerts.length - 1]!.createdAt;
              }

              await new Promise((resolve) => setTimeout(resolve, 10_000));
            } catch (error) {
              console.error("[GET /api/stream]", error);
              send("error", { data: null, meta: null, error: "Stream error" });
              break;
            }
          }
        };

        void poll();

        request.signal.addEventListener("abort", () => {
          closed = true;
          controller.close();
        });
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("[GET /api/stream]", error);
    return apiError("Internal server error", 500);
  }
}
