import { getLocale, getTranslations } from "next-intl/server";
import { cn } from "@/lib/constants";
import { SEVERITY_HEX, severityFromScore } from "@/lib/severity";

type Stats = {
  threatsTracked: number;
  breachesAnalyzed: number;
  countriesAffected: number;
  criticalAlerts: number;
  globalThreatLevel: number;
};

export async function IntelligenceStatsBar({ stats }: { stats: Stats }) {
  const t = await getTranslations("homePage");
  const locale = await getLocale();
  const fmt = new Intl.NumberFormat(locale === "ru" ? "ru-RU" : "en-US");

  const level = Math.max(0, Math.min(100, Math.round(stats.globalThreatLevel)));
  const levelSeverity = severityFromScore(level);
  const levelLabel = {
    CRITICAL: t("levelCritical"),
    HIGH: t("levelHigh"),
    MEDIUM: t("levelElevated"),
    LOW: t("levelLow"),
  }[levelSeverity];

  const items = [
    { label: t("statThreats"), value: fmt.format(stats.threatsTracked) },
    { label: t("statBreaches"), value: fmt.format(stats.breachesAnalyzed) },
    { label: t("statCountries"), value: fmt.format(stats.countriesAffected) },
    { label: t("statAlerts"), value: fmt.format(stats.criticalAlerts), alert: true },
  ];

  return (
    <section className="grid grid-cols-2 gap-3 md:grid-cols-5" aria-label={t("statThreatLevel")}>
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-line bg-surface px-4 py-4 md:px-5"
        >
          <p className="text-xs leading-snug text-fg-3">{item.label}</p>
          <p
            className={cn(
              "mt-2 flex items-center gap-2 text-[1.75rem] font-semibold leading-none tracking-tight tabular-nums md:text-[2rem]",
              item.alert ? "text-sev-critical" : "text-fg",
            )}
          >
            {item.value}
          </p>
        </div>
      ))}

      <div className="col-span-2 rounded-xl border border-line bg-surface px-4 py-4 md:col-span-1 md:px-5">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-xs leading-snug text-fg-3">{t("statThreatLevel")}</p>
          <span className="text-xs font-medium" style={{ color: SEVERITY_HEX[levelSeverity] }}>
            {levelLabel}
          </span>
        </div>
        <p className="mt-2 text-[1.75rem] font-semibold leading-none tracking-tight tabular-nums text-fg md:text-[2rem]">
          {level}
          <span className="ml-1 text-sm font-normal text-fg-4">/100</span>
        </p>
        <div className="relative mt-3 h-1.5 rounded-full bg-gradient-to-r from-sev-low via-sev-medium to-sev-critical opacity-90">
          <span
            className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-canvas bg-white shadow"
            style={{ left: `${level}%` }}
            aria-hidden
          />
        </div>
      </div>
    </section>
  );
}
