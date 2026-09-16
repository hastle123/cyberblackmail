import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SectionHeader } from "@/components/home/SectionHeader";
import { SeverityBadge } from "@/components/intel/SeverityBadge";
import { AttackMap } from "@/components/map/AttackMap";
import { CoverImage } from "@/components/news/CoverImage";
import { editorial } from "@/lib/editorial";
import { cn, formatRelativeTime } from "@/lib/constants";
import { localizeArticle } from "@/lib/localize";
import { cleanFeedSnippet } from "@/lib/article-text";
import { getCategoryCoverFallback, resolveArticleCover } from "@/lib/article-cover";
import {
  SEVERITY_BADGE,
  SEVERITY_BG,
  SEVERITY_HEX,
  SEVERITY_TEXT,
  severityFromScore,
} from "@/lib/severity";
import type { Severity, GroupStatus, Category } from "@prisma/client";

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

type ScamArticle = {
  slug: string;
  title: string;
  excerpt: string;
  severity: Severity;
  category: Category;
  publishedAt: Date | string;
  coverImage?: string | null;
  titleRu?: string | null;
  excerptRu?: string | null;
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

export async function ScamWatchStrip({ articles }: { articles: ScamArticle[] }) {
  const locale = await getLocale();
  const t = await getTranslations("homePage");
  if (articles.length === 0) return null;

  return (
    <section>
      <SectionHeader title={t("scamWatch")} href="/scams" linkLabel={t("viewAll")} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {articles.map((raw) => {
          const article = localizeArticle({ ...raw, content: "" }, locale);
          const coverSrc = resolveArticleCover({
            coverImage: raw.coverImage,
            category: raw.category,
            slug: raw.slug,
          });
          return (
            <Link
              key={raw.slug}
              href={`/intel/${raw.slug}`}
              className={`group lift ${editorial.card} flex flex-col overflow-hidden`}
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-surface-2">
                <CoverImage
                  src={coverSrc}
                  fallback={getCategoryCoverFallback(raw.category)}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                />
                <div className="absolute left-3 top-3">
                  <SeverityBadge severity={raw.severity} onImage />
                </div>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <time className="mb-1.5 text-[11px] text-fg-4">
                  {formatRelativeTime(raw.publishedAt, locale)}
                </time>
                <h3 className="line-clamp-3 font-serif text-base font-semibold leading-snug text-fg transition-colors group-hover:text-white">
                  {article.title}
                </h3>
                <p className={`mt-2 line-clamp-2 ${editorial.bodySm}`}>{cleanFeedSnippet(article.excerpt)}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export async function ThreatActorsStrip({ actors }: { actors: Actor[] }) {
  const t = await getTranslations("homePage");

  return (
    <section>
      <SectionHeader title={t("threatActors")} href="/actors" linkLabel={t("viewAll")} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {actors.map((actor) => (
          <Link
            key={actor.slug}
            href={`/actors/${actor.slug}`}
            className={`group lift ${editorial.card} relative flex flex-col overflow-hidden p-4`}
          >
            <span
              className={cn("absolute inset-x-0 top-0 h-[2px] opacity-80", SEVERITY_BG[actor.threatLevel])}
              aria-hidden
            />
            <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-fg-4">{actor.type}</p>
            <h3 className="mt-2 font-serif text-lg font-semibold leading-tight text-fg transition-colors group-hover:text-white">
              {actor.name}
            </h3>
            <div className="mt-auto pt-5">
              <div className="mb-1.5 flex items-center justify-between text-[11px]">
                <span className="text-fg-4">{t("intelScore")}</span>
                <span className={cn("font-mono tabular-nums", SEVERITY_TEXT[actor.threatLevel])}>
                  {actor.intelligenceScore}
                </span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-surface-3">
                <div
                  className={cn("h-full rounded-full", SEVERITY_BG[actor.threatLevel])}
                  style={{ width: `${Math.min(100, actor.intelligenceScore)}%` }}
                />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export async function VulnerabilityWatch({ cves }: { cves: Cve[] }) {
  const t = await getTranslations("homePage");

  return (
    <section className="min-w-0">
      <SectionHeader title={t("vulnerabilityWatch")} href="/vulnerabilities" linkLabel={t("viewAll")} />
      <ul className={`${editorial.panel} divide-y divide-line overflow-hidden`}>
        {cves.map((cve) => {
          // Colour by CVSS itself so the chip never contradicts the number
          const sev = severityFromScore(cve.cvssScore * 10);
          return (
            <li key={cve.cveId}>
              <Link
                href={`/vulnerabilities/${cve.cveId}`}
                className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-white/[0.025]"
              >
                <span
                  className={cn(
                    "flex h-9 w-12 shrink-0 items-center justify-center rounded-lg border font-mono text-sm font-semibold tabular-nums",
                    SEVERITY_BADGE[sev],
                  )}
                  title="CVSS"
                >
                  {cve.cvssScore.toFixed(1)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[13px] font-medium text-fg transition-colors group-hover:text-accent-strong">
                    {cve.cveId}
                  </p>
                  <p className="mt-0.5 truncate text-[13px] text-fg-3">{cve.description}</p>
                </div>
                <span className="text-fg-4 transition-transform group-hover:translate-x-0.5" aria-hidden>
                  →
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

const STATUS_STYLE: Record<GroupStatus, { dot: string; text: string }> = {
  ACTIVE: { dot: "bg-sev-critical", text: "text-sev-critical" },
  DISRUPTED: { dot: "bg-sev-medium", text: "text-sev-medium" },
  INACTIVE: { dot: "bg-fg-4", text: "text-fg-3" },
};

export async function RansomwareTracker({ groups }: { groups: Ransomware[] }) {
  const t = await getTranslations("homePage");
  const locale = await getLocale();
  const fmt = new Intl.NumberFormat(locale === "ru" ? "ru-RU" : "en-US");
  const statusLabel: Record<GroupStatus, string> = {
    ACTIVE: t("statusActive"),
    DISRUPTED: t("statusDisrupted"),
    INACTIVE: t("statusInactive"),
  };
  const maxVictims = Math.max(1, ...groups.map((g) => g.victimCount));

  return (
    <section className="min-w-0">
      <SectionHeader title={t("ransomwareTracker")} href="/ransomware" linkLabel={t("viewAll")} />
      <ul className={`${editorial.panel} divide-y divide-line overflow-hidden`}>
        {groups.map((g) => {
          const style = STATUS_STYLE[g.status];
          return (
            <li key={g.slug}>
              <Link
                href={`/ransomware/${g.slug}`}
                className="group block px-5 py-3.5 transition-colors hover:bg-white/[0.025]"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="truncate font-serif text-[15px] font-semibold text-fg transition-colors group-hover:text-white">
                      {g.name}
                    </h3>
                    <p className={cn("mt-0.5 flex items-center gap-1.5 text-xs", style.text)}>
                      <span className={cn("h-1.5 w-1.5 rounded-full", style.dot, g.status === "ACTIVE" && "animate-pulse")} />
                      {statusLabel[g.status]}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-base font-semibold tabular-nums text-fg">{fmt.format(g.victimCount)}</p>
                    <p className="text-[11px] text-fg-4">{t("victims")}</p>
                  </div>
                </div>
                <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-surface-3">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-accent-deep to-accent"
                    style={{ width: `${(g.victimCount / maxVictims) * 100}%` }}
                  />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function ScoreRows({
  rows,
  hrefBase,
}: {
  rows: { key: string; name: string; score: number; code?: string }[];
  hrefBase: string;
}) {
  return (
    <ul className={`${editorial.panel} divide-y divide-line overflow-hidden`}>
      {rows.map((row) => {
        const sev = severityFromScore(row.score);
        return (
          <li key={row.key}>
            <Link
              href={`${hrefBase}/${row.key}`}
              className="group grid grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_2.5rem] items-center gap-4 px-5 py-3 transition-colors hover:bg-white/[0.025]"
            >
              <span className="flex min-w-0 items-center gap-2.5">
                {row.code && (
                  <span className="w-7 shrink-0 rounded border border-line bg-surface-2 py-0.5 text-center font-mono text-[10px] text-fg-3">
                    {row.code}
                  </span>
                )}
                <span className="truncate text-sm font-medium text-fg-2 transition-colors group-hover:text-fg">
                  {row.name}
                </span>
              </span>
              <span className="h-1.5 overflow-hidden rounded-full bg-surface-3">
                <span
                  className="block h-full rounded-full"
                  style={{
                    width: `${Math.min(100, row.score)}%`,
                    background: `linear-gradient(90deg, ${SEVERITY_HEX[sev]}55, ${SEVERITY_HEX[sev]})`,
                  }}
                />
              </span>
              <span className={cn("text-right font-mono text-xs tabular-nums", SEVERITY_TEXT[sev])}>
                {row.score}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export async function CountryThreatGrid({ countries }: { countries: Country[] }) {
  const t = await getTranslations("homePage");

  return (
    <section className="min-w-0">
      <SectionHeader title={t("countryIntel")} href="/countries" linkLabel={t("viewAll")} />
      <ScoreRows
        hrefBase="/countries"
        rows={countries.map((c) => ({ key: c.code, code: c.code, name: c.name, score: c.intelligenceScore }))}
      />
    </section>
  );
}

export async function IndustryRiskGrid({ industries }: { industries: Industry[] }) {
  const t = await getTranslations("homePage");

  return (
    <section className="min-w-0">
      <SectionHeader title={t("industryRisk")} href="/industries" linkLabel={t("viewAll")} />
      <ScoreRows
        hrefBase="/industries"
        rows={industries.map((i) => ({ key: i.slug, name: i.name, score: i.intelligenceScore }))}
      />
    </section>
  );
}

export async function ThreatMapPreview({
  incidents,
}: {
  incidents: {
    lat: number;
    lng: number;
    severity: Severity;
    country: string;
    type: string;
    article?: { slug: string } | null;
  }[];
}) {
  const t = await getTranslations("homePage");

  return (
    <div className={`${editorial.panel} overflow-hidden`}>
      <Link
        href="/threat-map"
        className="group flex items-center justify-between gap-3 border-b border-line px-5 py-3.5 transition-colors hover:bg-white/[0.025]"
      >
        <div>
          <h3 className="flex items-center gap-2.5 text-sm font-semibold text-fg">
            <span className="live-dot" aria-hidden />
            {t("globalAttackMap")}
          </h3>
          <p className="mt-0.5 text-xs text-fg-4">{t("mapActive", { count: incidents.length })}</p>
        </div>
        <span className="text-fg-4 transition-transform group-hover:translate-x-0.5 group-hover:text-fg" aria-hidden>
          →
        </span>
      </Link>
      <AttackMap incidents={incidents} height={210} compact className="rounded-none border-0 shadow-none" />
    </div>
  );
}
