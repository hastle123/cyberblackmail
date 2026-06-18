import { getTranslations } from "next-intl/server";

type Stats = {
  threatsTracked: number;
  breachesAnalyzed: number;
  countriesAffected: number;
  criticalAlerts: number;
  globalThreatLevel: number;
};

export async function IntelligenceStatsBar({ stats }: { stats: Stats }) {
  const t = await getTranslations("homePage");

  const items = [
    { label: t("statThreats"), value: stats.threatsTracked.toLocaleString() },
    { label: t("statBreaches"), value: stats.breachesAnalyzed.toLocaleString() },
    { label: t("statCountries"), value: stats.countriesAffected.toLocaleString() },
    { label: t("statAlerts"), value: stats.criticalAlerts.toLocaleString() },
    { label: t("statThreatLevel"), value: `${stats.globalThreatLevel}` },
  ];

  return (
    <div className="mb-10 grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-white/[0.06] bg-white/[0.06] md:grid-cols-5">
      {items.map((item) => (
        <div key={item.label} className="bg-[#0f0f0f] px-4 py-4 md:px-5 md:py-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6b6b6b]">
            {item.label}
          </p>
          <p className="mt-2 font-serif text-2xl font-semibold tabular-nums text-[#fafafa] md:text-3xl">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
