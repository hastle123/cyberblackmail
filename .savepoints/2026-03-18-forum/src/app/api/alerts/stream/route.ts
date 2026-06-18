import { prisma } from "@/lib/prisma";
import { apiError, enforceRateLimit } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const limited = enforceRateLimit(request, "alerts-stream");
    if (limited) return limited;

    const encoder = new TextEncoder();
    let lastSeenAt = new Date();
    let closed = false;

    const stream = new ReadableStream({
      start(controller) {
        const send = (event: string, payload: unknown) => {
          if (closed) return;
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`)
          );
        };

        send("connected", {
          data: { timestamp: new Date().toISOString() },
          meta: null,
          error: null,
        });

        const poll = async () => {
          while (!closed) {
            try {
              const alerts = await prisma.alert.findMany({
                where: { createdAt: { gt: lastSeenAt } },
                orderBy: { createdAt: "asc" },
                take: 50,
                include: {
                  article: {
                    select: { id: true, slug: true, title: true, severity: true },
                  },
                },
              });

              if (alerts.length > 0) {
                lastSeenAt = alerts[alerts.length - 1]!.createdAt;
                send("alerts", { data: alerts, meta: null, error: null });
              } else {
                send("heartbeat", {
                  data: { timestamp: new Date().toISOString() },
                  meta: null,
                  error: null,
                });
              }

              await new Promise((resolve) => setTimeout(resolve, 10_000));
            } catch (error) {
              console.error("[GET /api/alerts/stream]", error);
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
    console.error("[GET /api/alerts/stream]", error);
    return apiError("Internal server error", 500);
  }
}
