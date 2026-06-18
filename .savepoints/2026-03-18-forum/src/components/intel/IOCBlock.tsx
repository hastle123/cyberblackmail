"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { SEVERITY_COLORS, cn } from "@/lib/constants";
import { SeverityBadge } from "@/components/intel/SeverityBadge";
import type { IOCType, Severity } from "@prisma/client";

export type IOCItem = {
  id: string;
  type: IOCType;
  value: string;
  threatLevel: Severity;
};

type IOCBlockProps = {
  iocs: IOCItem[];
  className?: string;
};

export function IOCBlock({ iocs, className }: IOCBlockProps) {
  const t = useTranslations("ioc");

  if (iocs.length === 0) {
    return (
      <div className={cn("rounded-xl p-4", className)}>
        <p className="text-xs text-[#484f58]">{t("empty")}</p>
      </div>
    );
  }

  return (
    <ul className={cn("space-y-2", className)}>
      {iocs.map((ioc) => (
        <IOCRow key={ioc.id} ioc={ioc} />
      ))}
    </ul>
  );
}

function IOCRow({ ioc }: { ioc: IOCItem }) {
  const t = useTranslations("ioc");
  const [copied, setCopied] = useState(false);
  const color = SEVERITY_COLORS[ioc.threatLevel];

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(ioc.value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }, [ioc.value]);

  return (
    <li className="flex items-center gap-3 rounded-lg border border-white/6 bg-[#050505]/50 px-3 py-2">
      <span
        className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider"
        style={{ color, backgroundColor: `${color}15`, border: `1px solid ${color}30` }}
      >
        {t(`types.${ioc.type}`)}
      </span>
      <code className="min-w-0 flex-1 truncate font-mono text-xs text-[#c41e1e]">
        {ioc.value}
      </code>
      <SeverityBadge severity={ioc.threatLevel} />
      <button
        type="button"
        onClick={copy}
        className={cn(
          "shrink-0 rounded border px-2 py-1 text-[9px] font-medium uppercase tracking-wider transition-colors",
          copied
            ? "border-[#c41e1e]/40 text-[#c41e1e]"
            : "border-white/10 text-[#888] hover:border-[#c41e1e]/30 hover:text-[#c41e1e]",
        )}
        aria-label={`${t("copy")} ${ioc.value}`}
      >
        {copied ? t("copied") : t("copy")}
      </button>
    </li>
  );
}
