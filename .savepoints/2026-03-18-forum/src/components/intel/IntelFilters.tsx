"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { editorial } from "@/lib/editorial";
import type { Category, Severity } from "@prisma/client";

const CATEGORIES: Category[] = [
  "BREAKING_BREACH", "RANSOMWARE", "DARKNET", "THREAT_INTEL",
  "ZERO_DAY", "DATA_LEAK", "APT", "CYBER_DEFENSE",
];
const SEVERITIES: Severity[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

export function IntelFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const t = useTranslations("intelFilters");
  const tCat = useTranslations("category");
  const tSev = useTranslations("severity");
  const category = params.get("category") ?? "";
  const severity = params.get("severity") ?? "";
  const search = params.get("search") ?? "";

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/intel?${next.toString()}`);
  };

  return (
    <div className="flex flex-wrap gap-3">
      <input
        type="search"
        defaultValue={search}
        placeholder={t("searchPlaceholder")}
        onKeyDown={(e) => {
          if (e.key === "Enter") update("search", (e.target as HTMLInputElement).value);
        }}
        className={`min-w-[180px] flex-1 ${editorial.input}`}
      />
      <select
        value={category}
        onChange={(e) => update("category", e.target.value)}
        className={editorial.input}
      >
        <option value="">{t("allCategories")}</option>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>{tCat(c)}</option>
        ))}
      </select>
      <select
        value={severity}
        onChange={(e) => update("severity", e.target.value)}
        className={editorial.input}
      >
        <option value="">{t("allSeverities")}</option>
        {SEVERITIES.map((s) => (
          <option key={s} value={s}>{tSev(s)}</option>
        ))}
      </select>
    </div>
  );
}
