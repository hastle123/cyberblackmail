import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { IntelShell } from "@/components/layout/IntelShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { ThreatReportCard } from "@/components/intel/ThreatReportCard";
import { ScamsFilters } from "@/components/scams/ScamsFilters";
import { editorial } from "@/lib/editorial";
import { getScamArticles } from "@/lib/data";
import { localizeArticle } from "@/lib/localize";
import {
  isValidScamTopic,
  isValidScamGroup,
  getPlatformBySlug,
  SCAM_METHODS,
  SCAM_PLATFORM_GROUPS,
  getPlatformsByGroup,
} from "@/lib/scams";
import type { Locale } from "@/i18n/routing";

type Props = {
  searchParams: Promise<{
    topic?: string;
    platform?: string;
    group?: string;
    search?: string;
  }>;
};

export async function generateMetadata() {
  const t = await getTranslations("scamsPage");
  return { title: t("title"), description: t("metaDescription") };
}

export default async function ScamsPage({ searchParams }: Props) {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("scamsPage");
  const params = await searchParams;

  const topic = params.topic && isValidScamTopic(params.topic) ? params.topic : undefined;
  const platform = params.platform;
  const group = params.group && isValidScamGroup(params.group) ? params.group : undefined;
  const search = params.search;

  const { items, total } = await getScamArticles({ topic, platform, group, search, limit: 50 });
  const articles = items.map((a) => localizeArticle(a, locale));

  const activePlatform = platform ? getPlatformBySlug(platform) : undefined;

  return (
    <IntelShell maxWidth="wide">
      <PageHeader title={t("title")} subtitle={t("subtitle", { count: total })} />

      <p className={`${editorial.panel} mb-6 p-4 ${editorial.body}`}>{t("feedNote")}</p>

      <section className="mb-8">
        <h2 className={`mb-3 ${editorial.sectionLabel}`}>{t("methodsTitle")}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {SCAM_METHODS.map((method) => (
            <div key={method.id} className={`${editorial.card} p-4`}>
              <span className="text-xl" aria-hidden>
                {method.icon}
              </span>
              <h3 className={`mt-2 ${editorial.cardTitleSm}`}>{t(`methods.${method.id}.title`)}</h3>
              <p className={`mt-2 ${editorial.bodySm}`}>{t(`methods.${method.id}.desc`)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className={`mb-3 ${editorial.sectionLabel}`}>{t("platformsTitle")}</h2>
        <p className={`mb-4 ${editorial.bodySm}`}>{t("platformsNote")}</p>
        {SCAM_PLATFORM_GROUPS.map((g) => {
          const platforms = getPlatformsByGroup(g);
          return (
            <div key={g} className="mb-5">
              <h3 className={`mb-2 text-xs font-bold uppercase tracking-wider text-[#b91c1c]`}>
                {t(`groups.${g}`)}
              </h3>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                {platforms.map((p) => (
                  <div
                    key={p.slug}
                    className={`${editorial.card} px-3 py-2.5 ${activePlatform?.slug === p.slug ? "ring-1 ring-[#e52525]/30" : ""}`}
                  >
                    <p className="text-sm font-medium text-[#ececec]">{p.name}</p>
                    <p className={editorial.meta}>{p.region}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      <section className="mb-6">
        <h2 className={`mb-4 ${editorial.sectionTitle}`}>
          {activePlatform
            ? t("reportsForPlatform", { platform: activePlatform.name })
            : group
              ? t("reportsForGroup", { group: t(`groups.${group}`) })
              : topic
                ? t(`reportsForTopic.${topic}`)
                : t("latestReports")}
        </h2>
        <Suspense fallback={null}>
          <ScamsFilters />
        </Suspense>
      </section>

      {articles.length > 0 ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {articles.map((article) => (
            <ThreatReportCard key={article.id} {...article} />
          ))}
        </div>
      ) : (
        <p className={`${editorial.panel} mt-6 p-6 text-center ${editorial.body}`}>{t("empty")}</p>
      )}
    </IntelShell>
  );
}
