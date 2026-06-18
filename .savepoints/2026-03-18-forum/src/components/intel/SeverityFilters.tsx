"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import type { Severity } from "@prisma/client";

const SEVERITIES: (Severity | "ALL")[] = ["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"];

export function SeverityFilters({ basePath = "/vulnerabilities" }: { basePath?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const t = useTranslations("severity");
  const tCommon = useTranslations("common");
  const current = params.get("severity") ?? "ALL";

  return (
    <div className="flex flex-wrap gap-2">
      {SEVERITIES.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => {
            const next = new URLSearchParams(params.toString());
            if (s === "ALL") next.delete("severity");
            else next.set("severity", s);
            router.push(`${basePath}?${next.toString()}`);
          }}
          className={`rounded px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition ${
            current === s || (s === "ALL" && !params.get("severity"))
              ? "border border-[#c41e1e]/30 bg-[#c41e1e]/12 text-[#e52525]"
              : "border border-white/10 text-[#888] hover:text-[#d4d4d4]"
          }`}
        >
          {s === "ALL" ? tCommon("all") : t(s)}
        </button>
      ))}
    </div>
  );
}
