import { Suspense } from "react";
import type { Category, Severity } from "@prisma/client";
import { getLocale, getTranslations } from "next-intl/server";
import { IntelShell } from "@/components/layout/IntelShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { ThreatReportCard } from "@/components/intel/ThreatReportCard";
import { IntelFilters } from "@/components/intel/IntelFilters";
import { getArticles } from "@/lib/data";
import { localizeArticle } from "@/lib/localize";
import type { Locale } from "@/i18n/routing";

type Props = {
  searchParams: Promise<{ category?: string; severity?: string; search?: string }>;
};

export async function generateMetadata() {
  const t = await getTranslations("intelPage");
  return { title: t("title") };
}

export default async function IntelPage({ searchParams }: Props) {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("intelPage");
  const params = await searchParams;
  const validCategories: Category[] = [
    "BREAKING_BREACH", "RANSOMWARE", "DARKNET", "SCAMS", "THREAT_INTEL",
    "ZERO_DAY", "DATA_LEAK", "APT", "CYBER_DEFENSE",
  ];
  const validSeverities: Severity[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

  const { items, total } = await getArticles({
    category: validCategories.includes(params.category as Category)
      ? (params.category as Category)
      : undefined,
    severity: validSeverities.includes(params.severity as Severity)
      ? (params.severity as Severity)
      : undefined,
    search: params.search,
    sortBy: "publishedAt",
    limit: 50,
  });

  const articles = items.map((article) => localizeArticle(article, locale));

  return (
    <IntelShell maxWidth="wide">
      <PageHeader title={t("title")} subtitle={t("subtitle", { count: total })}>
        <Suspense>
          <IntelFilters />
        </Suspense>
      </PageHeader>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <ThreatReportCard key={article.id} {...article} />
        ))}
      </div>
    </IntelShell>
  );
}
