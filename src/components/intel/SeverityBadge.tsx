"use client";

import { useTranslations } from "next-intl";
import type { Severity } from "@prisma/client";

const STYLES: Record<Severity, string> = {
  CRITICAL: "bg-[#c41e1e]/15 text-[#e52525] border-[#c41e1e]/40",
  HIGH: "bg-[#c41e1e]/10 text-[#c41e1e] border-[#c41e1e]/30",
  MEDIUM: "bg-[#8b4040]/10 text-[#a06060] border-[#8b4040]/25",
  LOW: "bg-[#2a2a2a] text-[#6b6b6b] border-[#333]",
};

export function SeverityBadge({
  severity,
  pulse = false,
  small = true,
}: {
  severity: Severity;
  pulse?: boolean;
  small?: boolean;
}) {
  const t = useTranslations("severity");

  return (
    <span
      className={`inline-flex items-center rounded-sm border font-medium uppercase tracking-wide ${STYLES[severity]} ${small ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]"}`}
    >
      {t(severity)}
    </span>
  );
}
