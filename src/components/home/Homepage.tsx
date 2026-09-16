import { getTranslations } from "next-intl/server";
import { FeaturedInvestigation } from "@/components/home/FeaturedInvestigation";
import { InFocusList } from "@/components/home/InFocusList";
import { IntelligenceStatsBar } from "@/components/home/IntelligenceStatsBar";
import { SectionHeader } from "@/components/home/SectionHeader";
import {
  EditorialArticleCard,
  EditorialArticleRow,
} from "@/components/home/EditorialArticleCard";
import {
  ThreatActorsStrip,
  ScamWatchStrip,
  VulnerabilityWatch,
  RansomwareTracker,
  CountryThreatGrid,
  IndustryRiskGrid,
  ThreatMapPreview,
} from "@/components/home/IntelModules";
import { HomeSidebar } from "@/components/home/HomeSidebar";
import { editorial } from "@/lib/editorial";
import { getHomepageData } from "@/lib/homepage-data";

export async function Homepage() {
  const t = await getTranslations("homePage");
  const data = await getHomepageData();

  return (
    <div className="mx-auto max-w-7xl px-4 pb-8 pt-6 lg:px-8 lg:pt-8">
      {/* Above the fold: lead story + secondary stories */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        {data.investigation && (
          <FeaturedInvestigation
            slug={data.investigation.slug}
            title={data.investigation.title}
            excerpt={data.investigation.excerpt}
            category={data.investigation.category}
            severity={data.investigation.severity}
            source={data.investigation.source}
            publishedAt={data.investigation.publishedAt}
            readTime={data.investigation.readTime}
            intelligenceScore={data.investigation.intelligenceScore}
            coverImage={data.investigation.coverImage}
            titleRu={data.investigation.titleRu}
            excerptRu={data.investigation.excerptRu}
          />
        )}
        <InFocusList articles={data.inFocus} />
      </div>

      <div className="mt-5">
        <IntelligenceStatsBar stats={data.stats} />
      </div>

      <div className="mt-16 grid gap-12 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-16">
          {data.topThreats.length > 0 && (
            <section>
              <SectionHeader title={t("topThreatsToday")} href="/intel" linkLabel={t("viewAll")} />
              <div className="grid gap-4 md:grid-cols-2">
                {data.topThreats.map((article) => (
                  <EditorialArticleCard key={article.slug} article={article} featured />
                ))}
              </div>
            </section>
          )}

          {data.latestReports.length > 0 && (
            <section>
              <SectionHeader title={t("latestReports")} href="/intel" linkLabel={t("viewAll")} />
              <div className={`${editorial.panel} divide-y divide-line px-2 py-1`}>
                {data.latestReports.map((article) => (
                  <EditorialArticleRow key={article.slug} article={article} />
                ))}
              </div>
            </section>
          )}
        </div>

        <HomeSidebar
          alerts={data.alerts}
          trending={data.trending}
          briefingDate={data.briefing?.generatedAt}
          mapSlot={<ThreatMapPreview incidents={data.incidents} />}
        />
      </div>

      <div className="mt-20 space-y-20">
        <ScamWatchStrip articles={data.scams} />
        <ThreatActorsStrip actors={data.actors} />

        <div className="grid gap-12 lg:grid-cols-2">
          <VulnerabilityWatch cves={data.cves} />
          <RansomwareTracker groups={data.ransomware} />
        </div>

        <div className="grid gap-12 lg:grid-cols-2">
          <CountryThreatGrid countries={data.countries} />
          <IndustryRiskGrid industries={data.industries} />
        </div>
      </div>
    </div>
  );
}
