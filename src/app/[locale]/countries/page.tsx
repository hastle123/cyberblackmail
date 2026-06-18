import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { IntelShell } from "@/components/layout/IntelShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable } from "@/components/intel/DataTable";
import { IntelligenceScoreGauge } from "@/components/intel/IntelligenceScoreGauge";
import { editorial } from "@/lib/editorial";
import { getCountries } from "@/lib/data";

export async function generateMetadata() {
  const t = await getTranslations("countriesPage");
  return { title: t("title") };
}

export default async function CountriesPage() {
  const t = await getTranslations("countriesPage");
  const countries = await getCountries();

  return (
    <IntelShell maxWidth="wide">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <DataTable
        data={countries}
        keyField="code"
        columns={[
          {
            key: "code",
            header: t("code"),
            render: (row) => (
              <Link href={`/countries/${row.code}`} className={`${editorial.link} text-sm font-semibold`}>
                {row.code}
              </Link>
            ),
          },
          {
            key: "name",
            header: t("country"),
            render: (row) => <span className="text-sm">{row.name}</span>,
          },
          {
            key: "region",
            header: t("region"),
            render: (row) => <span className={editorial.meta}>{row.region ?? "—"}</span>,
          },
          {
            key: "score",
            header: t("intelScore"),
            render: (row) => <IntelligenceScoreGauge score={row.intelligenceScore} size={36} />,
          },
          {
            key: "incidents",
            header: t("incidents"),
            render: (row) => <span className="text-sm">{row._count.incidents}</span>,
          },
          {
            key: "actors",
            header: t("actors"),
            render: (row) => <span className="text-sm">{row._count.actors}</span>,
          },
        ]}
      />
    </IntelShell>
  );
}
