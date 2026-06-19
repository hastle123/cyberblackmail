import { getTranslations } from "next-intl/server";
import { editorial } from "@/lib/editorial";
import { FeaturedInvestigation } from "@/components/home/FeaturedInvestigation";
import { IntelligenceStatsBar } from "@/components/home/IntelligenceStatsBar";
import { SectionHeader } from "@/components/home/SectionHeader";
import {
  EditorialArticleCard,
  EditorialArticleRow,
} from "@/components/home/EditorialArticleCard";
import {
  ThreatActorsStrip,
  VulnerabilityWatch,
  RansomwareTracker,
  CountryThreatGrid,
  IndustryRiskGrid,
  ThreatMapPreview,
} from "@/components/home/IntelModules";
import { HomeSidebar } from "@/components/home/HomeSidebar";
import { getHomepageData } from "@/lib/homepage-data";

export async function Homepage() {
  const t = await getTranslations("homePage");
  const data = await getHomepageData();

  const feedRest = data.articles.filter((a) => a.slug !== data.investigation?.slug);
  const latestReports = feedRest.slice(0, 8);
  const topThreatCards = data.topThreats.filter((a) => a.slug !== data.investigation?.slug);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8 lg:py-12">
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

      <IntelligenceStatsBar stats={data.stats} />

      <div className="grid gap-12 xl:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          {topThreatCards.length > 0 && (
            <section className="mb-12">
              <SectionHeader
                label={t("sectionLabel")}
                title={t("topThreatsToday")}
                href="/intel"
                linkLabel={t("viewAll")}
              />
              <div className="grid gap-4 md:grid-cols-2">
                {topThreatCards.map((article) => (
                  <EditorialArticleCard key={article.id} article={article} featured />
                ))}
              </div>
            </section>
          )}

          <section className="mb-12">
            <SectionHeader
              label={t("sectionLabel")}
              title={t("latestReports")}
              href="/intel"
              linkLabel={t("viewAll")}
            />
            <div className={`${editorial.card} divide-y divide-white/[0.05] px-5`}>
              {latestReports.map((article) => (
                <EditorialArticleRow key={article.id} article={article} />
              ))}
            </div>
          </section>

          <ThreatActorsStrip actors={data.actors} />
          <VulnerabilityWatch cves={data.cves} />
          <RansomwareTracker groups={data.ransomware} />

          <div className="grid gap-10 md:grid-cols-2">
            <CountryThreatGrid countries={data.countries} />
            <IndustryRiskGrid industries={data.industries} />
          </div>
        </div>

        <HomeSidebar
          alerts={data.alerts}
          trending={data.trending}
          briefingDate={data.briefing?.generatedAt}
          mapSlot={<ThreatMapPreview incidents={data.incidents} />}
        />
      </div>
    </div>
  );
}
