import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SectionHeader } from "@/components/home/SectionHeader";
import { SeverityBadge } from "@/components/intel/SeverityBadge";
import { editorial } from "@/lib/editorial";
import type { Severity, GroupStatus } from "@prisma/client";

type Actor = {
  slug: string;
  name: string;
  type: string;
  threatLevel: Severity;
  intelligenceScore: number;
};

type Cve = {
  cveId: string;
  cvssScore: number;
  severity: Severity;
  description: string;
};

type Ransomware = {
  slug: string;
  name: string;
  status: GroupStatus;
  victimCount: number;
  lastSeen: Date | string;
};

type Country = {
  code: string;
  name: string;
  intelligenceScore: number;
};

type Industry = {
  slug: string;
  name: string;
  intelligenceScore: number;
};

export async function ThreatActorsStrip({ actors }: { actors: Actor[] }) {
  const t = await getTranslations("homePage");

  return (
    <section className="mb-12">
      <SectionHeader
        label={t("sectionLabel")}
        title={t("threatActors")}
        href="/actors"
        linkLabel={t("viewAll")}
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {actors.map((actor) => (
          <Link
            key={actor.slug}
            href={`/actors/${actor.slug}`}
            className={`group ${editorial.card} block p-4 transition-colors`}
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-serif text-base font-semibold text-[#f0f0f0] group-hover:text-[#dc2626]">
                {actor.name}
              </h3>
              <SeverityBadge severity={actor.threatLevel} />
            </div>
            <p className={`mt-2 ${editorial.meta}`}>{actor.type}</p>
            <p className={`mt-3 text-xs tabular-nums text-[#525252]`}>
              {t("intelScore")}: {actor.intelligenceScore}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export async function VulnerabilityWatch({ cves }: { cves: Cve[] }) {
  const t = await getTranslations("homePage");

  return (
    <section className="mb-12">
      <SectionHeader
        label={t("sectionLabel")}
        title={t("vulnerabilityWatch")}
        href="/vulnerabilities"
        linkLabel={t("viewAll")}
      />
      <div className={`${editorial.card} overflow-hidden`}>
        <table className="data-table">
          <thead>
            <tr>
              <th>CVE</th>
              <th>CVSS</th>
              <th className="hidden sm:table-cell">{t("severity")}</th>
              <th className="hidden md:table-cell">{t("summary")}</th>
            </tr>
          </thead>
          <tbody>
            {cves.map((cve) => (
              <tr key={cve.cveId}>
                <td>
                  <Link
                    href={`/vulnerabilities/${cve.cveId}`}
                    className="font-mono text-sm text-[#e5e5e5] hover:text-[#dc2626]"
                  >
                    {cve.cveId}
                  </Link>
                </td>
                <td className="tabular-nums text-[#a3a3a3]">{cve.cvssScore.toFixed(1)}</td>
                <td className="hidden sm:table-cell">
                  <SeverityBadge severity={cve.severity} />
                </td>
                <td className="hidden max-w-md truncate md:table-cell text-[#8a8a8a]">
                  {cve.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export async function RansomwareTracker({ groups }: { groups: Ransomware[] }) {
  const t = await getTranslations("homePage");

  return (
    <section className="mb-12">
      <SectionHeader
        label={t("sectionLabel")}
        title={t("ransomwareTracker")}
        href="/ransomware"
        linkLabel={t("viewAll")}
      />
      <div className="grid gap-3 md:grid-cols-2">
        {groups.map((g) => (
          <Link
            key={g.slug}
            href={`/ransomware/${g.slug}`}
            className={`group flex items-center justify-between ${editorial.card} p-4`}
          >
            <div>
              <h3 className="font-serif font-semibold text-[#f0f0f0] group-hover:text-[#dc2626]">
                {g.name}
              </h3>
              <p className={`mt-1 ${editorial.meta}`}>
                {g.victimCount} {t("victims")} · {g.status}
              </p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#525252]">→</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export async function CountryThreatGrid({ countries }: { countries: Country[] }) {
  const t = await getTranslations("homePage");

  return (
    <section>
      <SectionHeader
        label={t("sectionLabel")}
        title={t("countryIntel")}
        href="/countries"
        linkLabel={t("viewAll")}
      />
      <div className="grid gap-2">
        {countries.map((c) => (
          <Link
            key={c.code}
            href={`/countries/${c.code}`}
            className={`group flex items-center justify-between ${editorial.card} px-4 py-3`}
          >
            <span className="text-sm font-medium text-[#e5e5e5] group-hover:text-[#dc2626]">
              {c.name}
            </span>
            <span className="text-xs tabular-nums text-[#6b6b6b]">{c.intelligenceScore}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export async function IndustryRiskGrid({ industries }: { industries: Industry[] }) {
  const t = await getTranslations("homePage");

  return (
    <section>
      <SectionHeader
        label={t("sectionLabel")}
        title={t("industryRisk")}
        href="/industries"
        linkLabel={t("viewAll")}
      />
      <div className="grid gap-2">
        {industries.map((ind) => (
          <Link
            key={ind.slug}
            href={`/industries/${ind.slug}`}
            className={`group flex items-center justify-between ${editorial.card} px-4 py-3`}
          >
            <span className="text-sm font-medium text-[#e5e5e5] group-hover:text-[#dc2626]">
              {ind.name}
            </span>
            <span className="text-xs tabular-nums text-[#6b6b6b]">{ind.intelligenceScore}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export async function ThreatMapPreview({
  incidentCount,
}: {
  incidentCount: number;
}) {
  const t = await getTranslations("homePage");

  return (
    <Link
      href="/threat-map"
      className={`group block ${editorial.card} overflow-hidden`}
    >
      <div className="border-b border-white/[0.06] bg-[#0f0f0f] px-4 py-3">
        <p className={editorial.sectionLabel}>{t("liveIntel")}</p>
        <h3 className="mt-1 font-serif text-base font-semibold text-[#f5f5f5]">
          {t("globalAttackMap")}
        </h3>
      </div>
      <div className="relative flex h-36 items-end bg-gradient-to-br from-[#141414] to-[#0a0a0a] p-4">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute left-[20%] top-[30%] h-2 w-2 rounded-full bg-[#dc2626]" />
          <div className="absolute left-[45%] top-[50%] h-1.5 w-1.5 rounded-full bg-[#b91c1c]" />
          <div className="absolute left-[70%] top-[25%] h-2 w-2 rounded-full bg-[#dc2626]" />
          <div className="absolute left-[55%] top-[65%] h-1 w-1 rounded-full bg-[#737373]" />
        </div>
        <p className={`relative ${editorial.bodySm}`}>
          {t("mapActive", { count: incidentCount })}
        </p>
      </div>
    </Link>
  );
}
