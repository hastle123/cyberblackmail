import { Link } from "@/i18n/navigation";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import type { Severity } from "@prisma/client";
import { IntelShell } from "@/components/layout/IntelShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable } from "@/components/intel/DataTable";
import { SeverityBadge } from "@/components/intel/SeverityBadge";
import { SeverityFilters } from "@/components/intel/SeverityFilters";
import { editorial } from "@/lib/editorial";
import { formatDate, jsonArray } from "@/lib/constants";
import { getCVEs } from "@/lib/data";

type Props = { searchParams: Promise<{ severity?: string }> };

export async function generateMetadata() {
  const t = await getTranslations("vulnsPage");
  return { title: t("title") };
}

export default async function VulnerabilitiesPage({ searchParams }: Props) {
  const t = await getTranslations("vulnsPage");
  const { severity } = await searchParams;
  const validSeverities: Severity[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
  const filter = validSeverities.includes(severity as Severity) ? (severity as Severity) : undefined;
  const cves = await getCVEs(filter);

  return (
    <IntelShell maxWidth="wide">
      <PageHeader title={t("title")} subtitle={t("subtitle", { count: cves.length })}>
        <Suspense>
          <SeverityFilters />
        </Suspense>
      </PageHeader>
      <DataTable
        data={cves}
        keyField="cveId"
        columns={[
          {
            key: "id",
            header: t("cveId"),
            render: (row) => (
              <Link href={`/vulnerabilities/${row.cveId}`} className={`${editorial.link} text-sm font-semibold`}>
                {row.cveId}
              </Link>
            ),
          },
          {
            key: "cvss",
            header: t("cvss"),
            render: (row) => <span className="text-sm">{row.cvssScore.toFixed(1)}</span>,
          },
          {
            key: "severity",
            header: t("severity"),
            render: (row) => <SeverityBadge severity={row.severity} />,
          },
          {
            key: "status",
            header: t("exploitStatus"),
            render: (row) => <span className={`${editorial.meta} uppercase`}>{row.exploitationStatus}</span>,
          },
          {
            key: "vendors",
            header: t("vendors"),
            render: (row) => (
              <span className={editorial.body}>{jsonArray(row.affectedVendors).slice(0, 2).join(", ")}</span>
            ),
          },
          {
            key: "refs",
            header: t("reports"),
            render: (row) => <span className="text-sm">{row._count.articles}</span>,
          },
          {
            key: "published",
            header: t("published"),
            render: (row) => <span className={editorial.meta}>{formatDate(row.publishedAt)}</span>,
          },
        ]}
      />
    </IntelShell>
  );
}
