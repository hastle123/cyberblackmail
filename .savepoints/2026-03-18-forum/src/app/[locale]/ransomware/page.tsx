import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { IntelShell } from "@/components/layout/IntelShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { IntelligenceScoreGauge } from "@/components/intel/IntelligenceScoreGauge";
import { editorial } from "@/lib/editorial";
import { formatDate } from "@/lib/constants";
import { getRansomwareGroups } from "@/lib/data";

export async function generateMetadata() {
  const t = await getTranslations("ransomwarePage");
  return { title: t("title") };
}

export default async function RansomwarePage() {
  const t = await getTranslations("ransomwarePage");
  const groups = await getRansomwareGroups();

  return (
    <IntelShell maxWidth="wide">
      <PageHeader title={t("title")} subtitle={t("subtitle", { count: groups.length })} />
      <div className="grid gap-4 md:grid-cols-2">
        {groups.map((group) => (
          <Link
            key={group.id}
            href={`/ransomware/${group.slug}`}
            className={`${editorial.panel} group p-5 transition hover:border-[#c41e1e]/30`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span
                  className={`${editorial.meta} uppercase ${
                    group.status === "ACTIVE" ? "text-[#e52525]" : ""
                  }`}
                >
                  {group.status === "ACTIVE" ? t("statusActive") : t("statusInactive")}
                </span>
                <h2 className={`mt-1 text-lg font-bold text-[#d4d4d4] group-hover:text-[#e52525] ${editorial.heading}`}>
                  {group.name}
                </h2>
              </div>
              <IntelligenceScoreGauge score={group.intelligenceScore} size={44} />
            </div>
            <p className={`mt-2 line-clamp-2 ${editorial.body}`}>{group.description}</p>
            <div className={`mt-4 flex gap-4 ${editorial.meta}`}>
              <span>{t("victims", { count: group.victimCount })}</span>
              <span>{t("lastSeen", { date: formatDate(group.lastSeen) })}</span>
            </div>
          </Link>
        ))}
      </div>
    </IntelShell>
  );
}
