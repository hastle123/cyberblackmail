import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { IntelShell } from "@/components/layout/IntelShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { IntelligenceScoreGauge } from "@/components/intel/IntelligenceScoreGauge";
import { SeverityBadge } from "@/components/intel/SeverityBadge";
import { DataTable } from "@/components/intel/DataTable";
import { editorial } from "@/lib/editorial";
import { formatDate } from "@/lib/constants";
import { getIndustryBySlug } from "@/lib/data";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const industry = await getIndustryBySlug(slug);
  return { title: industry?.name ?? "Industry Not Found" };
}

export default async function IndustryDetailPage({ params }: Props) {
  const t = await getTranslations("industriesPage");
  const tCommon = await getTranslations("common");
  const { slug } = await params;
  const industry = await getIndustryBySlug(slug);
  if (!industry) notFound();

  return (
    <IntelShell maxWidth="wide">
      <PageHeader title={industry.name} subtitle={industry.description ?? undefined}>
        <IntelligenceScoreGauge score={industry.intelligenceScore} label={tCommon("riskScore")} />
      </PageHeader>

      <div className="space-y-8">
        <section>
          <h2 className={editorial.sectionTitle}>{t("sectorBreaches")}</h2>
          <div className="mt-4">
            <DataTable
              data={industry.breaches}
              keyField="id"
              columns={[
                { key: "org", header: t("organization"), render: (r) => r.organization },
                { key: "records", header: t("records"), render: (r) => r.recordsExposed },
                { key: "severity", header: t("severity"), render: (r) => <SeverityBadge severity={r.severity} /> },
                { key: "date", header: t("date"), render: (r) => formatDate(r.breachDate) },
              ]}
            />
          </div>
        </section>

        <section>
          <h2 className={editorial.sectionTitle}>{t("activeCampaigns")}</h2>
          <ul className="mt-4 space-y-2">
            {industry.campaigns.map((campaign) => (
              <li key={campaign.id} className={`${editorial.panel} p-4`}>
                <p className="text-sm font-semibold text-[#d4d4d4]">{campaign.name}</p>
                {campaign.actor && (
                  <Link href={`/actors/${campaign.actor.slug}`} className={`${editorial.link} text-xs`}>
                    {campaign.actor.name}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </IntelShell>
  );
}
