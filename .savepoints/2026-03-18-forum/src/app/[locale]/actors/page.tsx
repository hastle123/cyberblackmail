import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { IntelShell } from "@/components/layout/IntelShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { SeverityBadge } from "@/components/intel/SeverityBadge";
import { IntelligenceScoreGauge } from "@/components/intel/IntelligenceScoreGauge";
import { editorial } from "@/lib/editorial";
import { getActors } from "@/lib/data";

export async function generateMetadata() {
  const t = await getTranslations("actorsPage");
  return { title: t("title") };
}

export default async function ActorsPage() {
  const t = await getTranslations("actorsPage");
  const actors = await getActors();

  return (
    <IntelShell maxWidth="wide">
      <PageHeader title={t("title")} subtitle={t("subtitle", { count: actors.length })} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {actors.map((actor) => (
          <Link
            key={actor.id}
            href={`/actors/${actor.slug}`}
            className={`${editorial.panel} group p-5 transition hover:border-[#c41e1e]/30`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <SeverityBadge severity={actor.threatLevel} />
                  <span className={editorial.meta}>{actor.type}</span>
                </div>
                <h2 className={`mt-2 text-sm font-semibold text-[#d4d4d4] group-hover:text-[#e52525] ${editorial.heading}`}>
                  {actor.name}
                </h2>
              </div>
              <IntelligenceScoreGauge score={actor.intelligenceScore} size={40} />
            </div>
            <p className={`mt-2 line-clamp-2 ${editorial.body}`}>{actor.description}</p>
            <div className={`mt-3 ${editorial.meta}`}>
              {t("reports", { count: actor._count.articles })} · {t("campaigns", { count: actor._count.campaigns })}
            </div>
          </Link>
        ))}
      </div>
    </IntelShell>
  );
}
