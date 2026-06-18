"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { SeverityBadge } from "@/components/intel/SeverityBadge";
import { DataTable } from "@/components/intel/DataTable";
import { editorial } from "@/lib/editorial";
import { formatDate } from "@/lib/constants";
import type { IOCType, Severity } from "@prisma/client";

export type IOCRow = {
  id: string;
  type: IOCType;
  value: string;
  threatLevel: Severity;
  intelligenceScore: number;
  firstSeen: Date | string;
  lastSeen: Date | string;
  _count: { articles: number; incidents: number };
};

const IOC_TYPES: (IOCType | "ALL")[] = ["ALL", "IP", "DOMAIN", "URL", "HASH", "EMAIL"];

export function IOCExplorer({ iocs }: { iocs: IOCRow[] }) {
  const t = useTranslations("iocExplorer");
  const tIoc = useTranslations("ioc.types");
  const [search, setSearch] = useState("");
  const [type, setType] = useState<IOCType | "ALL">("ALL");

  const filtered = useMemo(() => {
    return iocs.filter((ioc) => {
      const matchesType = type === "ALL" || ioc.type === type;
      const matchesSearch =
        !search || ioc.value.toLowerCase().includes(search.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [iocs, search, type]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className={`min-w-[200px] flex-1 ${editorial.input}`}
        />
        <div className="flex flex-wrap gap-1">
          {IOC_TYPES.map((iocType) => (
            <button
              key={iocType}
              type="button"
              onClick={() => setType(iocType)}
              className={`rounded px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition ${
                type === iocType
                  ? "border border-[#c41e1e]/30 bg-[#c41e1e]/12 text-[#e52525]"
                  : "border border-white/10 text-[#888] hover:text-[#d4d4d4]"
              }`}
            >
              {iocType === "ALL" ? t("all") : tIoc(iocType)}
            </button>
          ))}
        </div>
      </div>
      <DataTable
        data={filtered}
        keyField="id"
        emptyMessage={t("empty")}
        columns={[
          {
            key: "type",
            header: t("type"),
            render: (row) => <span className={editorial.meta}>{tIoc(row.type)}</span>,
          },
          {
            key: "value",
            header: t("value"),
            render: (row) => (
              <span className="font-mono text-sm text-[#c41e1e]">{row.value}</span>
            ),
          },
          {
            key: "threat",
            header: t("threat"),
            render: (row) => <SeverityBadge severity={row.threatLevel} />,
          },
          {
            key: "score",
            header: t("score"),
            render: (row) => <span className="text-sm">{row.intelligenceScore}</span>,
          },
          {
            key: "refs",
            header: t("refs"),
            render: (row) => (
              <span className={editorial.meta}>
                {row._count.articles}A / {row._count.incidents}I
              </span>
            ),
          },
          {
            key: "lastSeen",
            header: t("lastSeen"),
            render: (row) => <span className={editorial.meta}>{formatDate(row.lastSeen)}</span>,
          },
        ]}
      />
      <p className={editorial.meta}>
        {t("showing", { filtered: filtered.length, total: iocs.length })}
      </p>
    </div>
  );
}
