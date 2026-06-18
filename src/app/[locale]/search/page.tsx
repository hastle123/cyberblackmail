import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { IntelShell } from "@/components/layout/IntelShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { SeverityBadge } from "@/components/intel/SeverityBadge";
import { IntelligenceScoreGauge } from "@/components/intel/IntelligenceScoreGauge";
import { editorial } from "@/lib/editorial";
import { globalSearch } from "@/lib/data";
import { localizeArticleRef } from "@/lib/localize";
import type { Locale } from "@/i18n/routing";

type Props = { searchParams: Promise<{ q?: string }> };

export async function generateMetadata() {
  const t = await getTranslations("searchUi");
  return { title: t("pageTitle") };
}

export default async function SearchPage({ searchParams }: Props) {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("searchUi");
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const results = query ? await globalSearch(query) : null;

  const totalResults = results
    ? results.articles.length +
      results.iocs.length +
      results.actors.length +
      results.companies.length +
      results.breaches.length +
      results.cves.length +
      results.countries.length
    : 0;

  return (
    <IntelShell maxWidth="wide">
      <PageHeader
        title={t("pageTitle")}
        subtitle={
          query ? t("resultsFor", { count: totalResults, query }) : t("pageSubtitle")
        }
      />

      {!query && <p className={editorial.body}>{t("hint")}</p>}

      {results && (
        <div className="space-y-8">
          {results.articles.length > 0 && (
            <SearchSection title={t("sections.articles")}>
              {results.articles.map((a) => {
                const article = localizeArticleRef(a, locale);
                return (
                  <Link key={a.slug} href={`/intel/${a.slug}`} className="flex items-center gap-2 py-2 intel-link text-sm">
                    <SeverityBadge severity={a.severity} />
                    {article.title}
                  </Link>
                );
              })}
            </SearchSection>
          )}
          {results.actors.length > 0 && (
            <SearchSection title={t("sections.actors")}>
              {results.actors.map((a) => (
                <Link key={a.slug} href={`/actors/${a.slug}`} className="block py-2 intel-link text-sm">
                  {a.name}
                </Link>
              ))}
            </SearchSection>
          )}
          {results.companies.length > 0 && (
            <SearchSection title={t("sections.companies")}>
              {results.companies.map((c) => (
                <Link key={c.slug} href={`/companies/${c.slug}`} className="flex items-center gap-3 py-2 intel-link text-sm">
                  {c.name}
                  <IntelligenceScoreGauge score={c.intelligenceScore} size={32} />
                </Link>
              ))}
            </SearchSection>
          )}
          {results.cves.length > 0 && (
            <SearchSection title={t("sections.cves")}>
              {results.cves.map((c) => (
                <Link key={c.cveId} href={`/vulnerabilities/${c.cveId}`} className="flex items-center gap-2 py-2 intel-link text-sm">
                  <SeverityBadge severity={c.severity} />
                  {c.cveId} (CVSS {c.cvssScore})
                </Link>
              ))}
            </SearchSection>
          )}
          {results.iocs.length > 0 && (
            <SearchSection title={t("sections.iocs")}>
              {results.iocs.map((ioc) => (
                <p key={ioc.id} className="py-1 font-mono text-sm text-[#c41e1e]">
                  [{ioc.type}] {ioc.value}
                </p>
              ))}
            </SearchSection>
          )}
          {results.breaches.length > 0 && (
            <SearchSection title={t("sections.breaches")}>
              {results.breaches.map((b) => (
                <p key={b.id} className="flex items-center gap-2 py-2 text-sm">
                  <SeverityBadge severity={b.severity} />
                  {b.organization}
                </p>
              ))}
            </SearchSection>
          )}
          {results.countries.length > 0 && (
            <SearchSection title={t("sections.countries")}>
              {results.countries.map((c) => (
                <Link key={c.code} href={`/countries/${c.code}`} className="block py-2 intel-link text-sm">
                  {c.name} ({c.code})
                </Link>
              ))}
            </SearchSection>
          )}
          {totalResults === 0 && (
            <p className={editorial.meta}>{t("notFound", { query })}</p>
          )}
        </div>
      )}
    </IntelShell>
  );
}

function SearchSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={`${editorial.panel} p-5`}>
      <h2 className={editorial.sectionTitle}>{title}</h2>
      <div className="mt-3 divide-y divide-white/5">{children}</div>
    </section>
  );
}
