import { getLocale, getTranslations } from "next-intl/server";
import { IntelShell } from "@/components/layout/IntelShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { ThreatReportCard } from "@/components/intel/ThreatReportCard";
import { editorial } from "@/lib/editorial";
import { getArticles } from "@/lib/data";
import { localizeArticle } from "@/lib/localize";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata() {
  const t = await getTranslations("darknetPage");
  return { title: t("title") };
}

export default async function DarknetPage() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("darknetPage");
  const { items, total } = await getArticles({ category: "DARKNET", limit: 50 });
  const articles = items.map((a) => localizeArticle(a, locale));

  return (
    <IntelShell maxWidth="wide">
      <PageHeader title={t("title")} subtitle={t("subtitle", { count: total })} />
      <p className={`${editorial.panel} mb-6 p-4 ${editorial.body}`}>{t("feedNote")}</p>
      <div className="grid gap-4 md:grid-cols-2">
        {articles.map((article) => (
          <ThreatReportCard key={article.id} {...article} />
        ))}
      </div>
    </IntelShell>
  );
}
