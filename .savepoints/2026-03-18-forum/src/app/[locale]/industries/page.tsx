import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { IntelShell } from "@/components/layout/IntelShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { IntelligenceScoreGauge } from "@/components/intel/IntelligenceScoreGauge";
import { editorial } from "@/lib/editorial";
import { getIndustries } from "@/lib/data";

export async function generateMetadata() {
  const t = await getTranslations("industriesPage");
  return { title: t("title") };
}

export default async function IndustriesPage() {
  const t = await getTranslations("industriesPage");
  const industries = await getIndustries();

  return (
    <IntelShell maxWidth="wide">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {industries.map((industry) => (
          <Link
            key={industry.id}
            href={`/industries/${industry.slug}`}
            className={`${editorial.panel} group p-5 transition hover:border-[#c41e1e]/30`}
          >
            <div className="flex items-start justify-between">
              <h2 className={`text-sm font-semibold text-[#d4d4d4] group-hover:text-[#e52525] ${editorial.heading}`}>
                {industry.name}
              </h2>
              <IntelligenceScoreGauge score={industry.intelligenceScore} size={40} />
            </div>
            {industry.description && (
              <p className={`mt-2 line-clamp-2 ${editorial.body}`}>{industry.description}</p>
            )}
            <div className={`mt-4 flex flex-wrap gap-3 ${editorial.meta}`}>
              <span>{t("breaches", { count: industry._count.breaches })}</span>
              <span>{t("incidents", { count: industry._count.incidents })}</span>
              <span>{t("campaigns", { count: industry._count.campaigns })}</span>
            </div>
          </Link>
        ))}
      </div>
    </IntelShell>
  );
}
