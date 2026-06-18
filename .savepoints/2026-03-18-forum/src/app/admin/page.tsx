import { IntelShell } from "@/components/layout/IntelShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { getPlatformStats } from "@/lib/data";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Admin" };

export default async function AdminPage() {
  const stats = await getPlatformStats();
  const sources = await prisma.source.findMany();
  const recentLogs = await prisma.auditLog.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
  });

  const cards = [
    { label: "Articles", value: stats.threatsTracked },
    { label: "Breaches", value: stats.breachesAnalyzed },
    { label: "IOCs", value: await prisma.iOC.count() },
    { label: "Alerts", value: await prisma.alert.count() },
    { label: "Actors", value: await prisma.threatActor.count() },
    { label: "CVEs", value: await prisma.cVE.count() },
  ];

  return (
    <IntelShell maxWidth="wide">
      <PageHeader
        title="Admin Console"
        subtitle="Intelligence platform management — authentication layer ready for NextAuth integration."
      />
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="glass-panel rounded-xl p-5">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[#888]">{c.label}</p>
            <p className="mt-2 font-mono text-3xl font-bold text-[#c41e1e]">{c.value}</p>
          </div>
        ))}
      </div>
      <section className="mb-8">
        <h2 className="mb-3 font-mono text-xs font-bold uppercase tracking-wider text-[#c41e1e]">
          RSS Sources
        </h2>
        <div className="glass-panel rounded-xl p-4">
          {sources.map((s) => (
            <div key={s.id} className="flex items-center justify-between border-b border-white/5 py-2 last:border-0">
              <span className="text-sm">{s.name}</span>
              <span className={`font-mono text-[10px] ${s.active ? "text-[#c41e1e]" : "text-[#888]"}`}>
                {s.active ? "ACTIVE" : "INACTIVE"}
              </span>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h2 className="mb-3 font-mono text-xs font-bold uppercase tracking-wider text-[#FF3B3B]">
          Audit Log
        </h2>
        <div className="glass-panel rounded-xl p-4 font-mono text-xs text-[#888]">
          {recentLogs.length === 0 ? (
            <p>No audit events yet. Audit logging is enabled for admin actions.</p>
          ) : (
            recentLogs.map((log) => (
              <div key={log.id} className="py-1">
                [{log.createdAt.toISOString()}] {log.action} — {log.entity}
              </div>
            ))
          )}
        </div>
      </section>
    </IntelShell>
  );
}
