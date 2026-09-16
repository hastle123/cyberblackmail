import type { Severity } from "@prisma/client";

/** Hex values mirror the --color-sev-* tokens in globals.css (for SVG/inline styles). */
export const SEVERITY_HEX: Record<Severity, string> = {
  CRITICAL: "#ff4d52",
  HIGH: "#ff8a3d",
  MEDIUM: "#f5c542",
  LOW: "#5aa9ff",
};

export const SEVERITY_TEXT: Record<Severity, string> = {
  CRITICAL: "text-sev-critical",
  HIGH: "text-sev-high",
  MEDIUM: "text-sev-medium",
  LOW: "text-sev-low",
};

export const SEVERITY_BG: Record<Severity, string> = {
  CRITICAL: "bg-sev-critical",
  HIGH: "bg-sev-high",
  MEDIUM: "bg-sev-medium",
  LOW: "bg-sev-low",
};

export const SEVERITY_BADGE: Record<Severity, string> = {
  CRITICAL: "border-sev-critical/35 bg-sev-critical/12 text-sev-critical",
  HIGH: "border-sev-high/30 bg-sev-high/10 text-sev-high",
  MEDIUM: "border-sev-medium/25 bg-sev-medium/8 text-sev-medium",
  LOW: "border-sev-low/25 bg-sev-low/8 text-sev-low",
};

/** Map a 0–100 score (or CVSS × 10) onto the severity scale. */
export function severityFromScore(score: number): Severity {
  if (score >= 90) return "CRITICAL";
  if (score >= 70) return "HIGH";
  if (score >= 40) return "MEDIUM";
  return "LOW";
}
