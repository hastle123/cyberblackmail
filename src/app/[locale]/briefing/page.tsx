import { getTranslations } from "next-intl/server";
import { IntelShell } from "@/components/layout/IntelShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { SeverityBadge } from "@/components/intel/SeverityBadge";
import { formatDate } from "@/lib/constants";
import { editorial } from "@/lib/editorial";
import { getLatestBriefing } from "@/lib/data";
import type { Severity } from "@prisma/client";

type BriefingItem = { name?: string; org?: string; severity?: string; change?: string; records?: string; sector?: string };

export async function generateMetadata() {
  const t = await getTranslations("briefingPage");
  return { title: t("title") };
}

export default async function BriefingPage() {
  const t = await getTranslations("briefingPage");
  const briefing = await getLatestBriefing();

  if (!briefing) {
    return (
      <IntelShell>
        <PageHeader title={t("title")} subtitle={t("empty")} />
      </IntelShell>
    );
  }

  const topThreats = (briefing.topThreats as { items: BriefingItem[] }).items ?? [];
  const majorBreaches = (briefing.majorBreaches as { items: BriefingItem[] }).items ?? [];
  const ransomware = briefing.ransomwareActivity as {
    newVictims?: number;
    activeGroups?: string[];
  };
  const aptCampaigns = (briefing.aptCampaigns as { items: { name: string; actor: string }[] }).items ?? [];
  const vulnHighlights = (briefing.vulnerabilityHighlights as { items: BriefingItem[] }).items ?? [];

  return (
    <IntelShell maxWidth="wide">
      <PageHeader
        title={t("title")}
        subtitle={t("generated", {
          date: formatDate(briefing.date),
          generatedAt: formatDate(briefing.generatedAt),
        })}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <BriefingSection title={t("topThreats")}>
          <ul className="space-y-3">
            {topThreats.map((item, i) => (
              <li key={i} className={`${editorial.panel} flex items-center justify-between p-3`}>
                <span className="text-sm text-[#d4d4d4]">{item.name}</span>
                <div className="flex items-center gap-2">
                  {item.severity && <SeverityBadge severity={item.severity as Severity} />}
                  {item.change && <span className={editorial.meta}>{item.change}</span>}
                </div>
              </li>
            ))}
          </ul>
        </BriefingSection>

        <BriefingSection title={t("majorBreaches")}>
          <ul className="space-y-3">
            {majorBreaches.map((b, i) => (
              <li key={i} className={`${editorial.panel} p-3`}>
                <p className="text-sm text-[#d4d4d4]">{b.org}</p>
                <p className={editorial.meta}>
                  {t("recordsSector", { records: b.records ?? "—", sector: b.sector ?? "—" })}
                </p>
              </li>
            ))}
          </ul>
        </BriefingSection>

        <BriefingSection title={t("ransomwareActivity")}>
          <p className="text-2xl font-bold text-[#e52525]">{ransomware.newVictims ?? 0}</p>
          <p className={editorial.meta}>{t("newVictims")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(ransomware.activeGroups ?? []).map((g) => (
              <span key={g} className="rounded border border-[#c41e1e]/30 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#e52525]">
                {g}
              </span>
            ))}
          </div>
        </BriefingSection>

        <BriefingSection title={t("aptCampaigns")}>
          <ul className="space-y-2">
            {aptCampaigns.map((c, i) => (
              <li key={i} className="text-sm">
                <span className="text-[#d4d4d4]">{c.name}</span>
                <span className="text-[#888]"> — {c.actor}</span>
              </li>
            ))}
          </ul>
        </BriefingSection>

        <BriefingSection title={t("vulnHighlights")} className="lg:col-span-2">
          <ul className="grid gap-3 sm:grid-cols-2">
            {vulnHighlights.map((v, i) => (
              <li key={i} className={`${editorial.panel} p-3 text-sm text-[#d4d4d4]`}>
                {v.name}
                {v.severity && (
                  <span className="ml-2">
                    <SeverityBadge severity={v.severity as Severity} />
                  </span>
                )}
              </li>
            ))}
          </ul>
        </BriefingSection>
      </div>
    </IntelShell>
  );
}

function BriefingSection({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`${editorial.panel} p-5 ${className}`}>
      <h2 className={editorial.sectionTitle}>{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
