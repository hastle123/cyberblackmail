"use client";

import { useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { SeverityBadge } from "@/components/intel/SeverityBadge";
import { DataTable } from "@/components/intel/DataTable";
import { editorial } from "@/lib/editorial";
import { formatDate } from "@/lib/constants";
import type { Severity } from "@prisma/client";

export type BreachRow = {
  id: string;
  organization: string;
  recordsExposed: string;
  dataTypes: string[];
  industry: string | null;
  breachDate: Date | string;
  severity: Severity;
  intelligenceScore: number;
  company: { slug: string; name: string } | null;
  article: { slug: string; title: string } | null;
};

export function BreachSearchTable({ breaches }: { breaches: BreachRow[] }) {
  const t = useTranslations("breachesTable");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return breaches;
    return breaches.filter(
      (b) =>
        b.organization.toLowerCase().includes(q) ||
        b.industry?.toLowerCase().includes(q) ||
        b.dataTypes.some((d) => d.toLowerCase().includes(q)),
    );
  }, [breaches, search]);

  return (
    <div className="space-y-4">
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t("searchPlaceholder")}
        className={`w-full max-w-md ${editorial.input}`}
      />
      <DataTable
        data={filtered}
        keyField="id"
        emptyMessage={t("empty")}
        columns={[
          {
            key: "org",
            header: t("organization"),
            render: (row) => (
              <div>
                {row.company ? (
                  <Link href={`/companies/${row.company.slug}`} className={`${editorial.link} text-sm`}>
                    {row.organization}
                  </Link>
                ) : (
                  <span className="text-sm">{row.organization}</span>
                )}
              </div>
            ),
          },
          {
            key: "records",
            header: t("records"),
            render: (row) => <span className="text-sm">{row.recordsExposed}</span>,
          },
          {
            key: "severity",
            header: t("severity"),
            render: (row) => <SeverityBadge severity={row.severity} />,
          },
          {
            key: "industry",
            header: t("industry"),
            render: (row) => <span className={editorial.meta}>{row.industry ?? "—"}</span>,
          },
          {
            key: "date",
            header: t("date"),
            render: (row) => <span className={editorial.meta}>{formatDate(row.breachDate)}</span>,
          },
          {
            key: "report",
            header: t("report"),
            render: (row) =>
              row.article ? (
                <Link href={`/intel/${row.article.slug}`} className={`${editorial.link} text-xs`}>
                  {t("view")}
                </Link>
              ) : (
                <span className="text-[#888]">—</span>
              ),
          },
        ]}
      />
    </div>
  );
}
