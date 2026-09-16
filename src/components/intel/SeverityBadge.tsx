// Shared component: no "use client", so it renders on the server when imported
// from Server Components and uses the client provider when imported from client ones.
import { useTranslations } from "next-intl";
import type { Severity } from "@prisma/client";
import { SEVERITY_BADGE, SEVERITY_BG, SEVERITY_TEXT } from "@/lib/severity";

export function SeverityBadge({
  severity,
  pulse = false,
  small = true,
  onImage = false,
  className = "",
}: {
  severity: Severity;
  pulse?: boolean;
  small?: boolean;
  /** Solid dark chip that stays legible over photos */
  onImage?: boolean;
  className?: string;
}) {
  const t = useTranslations("severity");
  const tone = onImage
    ? `border-white/10 bg-black/75 backdrop-blur-md ${SEVERITY_TEXT[severity]}`
    : SEVERITY_BADGE[severity];

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border font-medium ${tone} ${small ? "px-2 py-[3px] text-[10.5px]" : "px-2.5 py-1 text-xs"} ${className}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${SEVERITY_BG[severity]} ${pulse ? "animate-pulse" : ""}`}
        aria-hidden
      />
      {t(severity)}
    </span>
  );
}

export function SeverityDot({ severity, className = "" }: { severity: Severity; className?: string }) {
  return (
    <span
      className={`inline-block h-2 w-2 shrink-0 rounded-full ${SEVERITY_BG[severity]} ${className}`}
      aria-hidden
    />
  );
}
