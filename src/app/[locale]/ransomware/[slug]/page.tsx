import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { IntelShell } from "@/components/layout/IntelShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { IntelligenceScoreGauge } from "@/components/intel/IntelligenceScoreGauge";
import { editorial } from "@/lib/editorial";
import { formatDate, jsonArray } from "@/lib/constants";
import { getRansomwareBySlug } from "@/lib/data";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const group = await getRansomwareBySlug(slug);
  return { title: group?.name ?? "Group Not Found" };
}

export default async function RansomwareDetailPage({ params }: Props) {
  const t = await getTranslations("ransomwarePage");
  const tCommon = await getTranslations("common");
  const { slug } = await params;
  const group = await getRansomwareBySlug(slug);
  if (!group) notFound();

  const industries = jsonArray(group.industries);
  const countries = jsonArray(group.countries);
  const statusLabel = group.status === "ACTIVE" ? t("statusActive") : t("statusInactive");

  return (
    <IntelShell maxWidth="wide">
      <PageHeader
        title={group.name}
        subtitle={t("detailSubtitle", { status: statusLabel, count: group.victimCount })}
      >
        <IntelligenceScoreGauge score={group.intelligenceScore} label={tCommon("threatScore")} />
      </PageHeader>

      <div className={`${editorial.panel} mb-8 p-6`}>
        <p className={editorial.body}>{group.description}</p>
        <p className={`mt-4 ${editorial.meta}`}>
          {t("lastObserved", { date: formatDate(group.lastSeen) })}
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <section>
          <h2 className={editorial.sectionTitle}>{t("targetIndustries")}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {industries.map((ind) => (
              <span key={ind} className={editorial.tag}>
                {ind}
              </span>
            ))}
          </div>
        </section>
        <section>
          <h2 className={editorial.sectionTitle}>{t("targetCountries")}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {countries.map((c) => (
              <span key={c} className={`${editorial.tag} border-white/10 bg-transparent text-[#888]`}>
                {c}
              </span>
            ))}
          </div>
        </section>
      </div>

      {group.actor && (
        <section className="mt-8">
          <Link href={`/actors/${group.actor.slug}`} className={`${editorial.link} text-sm`}>
            {t("viewActorProfile")}: {group.actor.name} →
          </Link>
        </section>
      )}
    </IntelShell>
  );
}
