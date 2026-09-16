import type { Category, Severity } from "@prisma/client";
import { getAllScamKeywords } from "@/lib/scams";

const SCAM_KEYWORDS = getAllScamKeywords();

const RULES: { keywords: string[]; category: Category; severity: Severity }[] = [
  { keywords: SCAM_KEYWORDS, category: "SCAMS", severity: "HIGH" },
  { keywords: ["ransomware", "lockbit", "blackcat", "akira", "encrypt"], category: "RANSOMWARE", severity: "CRITICAL" },
  { keywords: ["zero-day", "zero day", "0-day", "cve-", "vulnerability"], category: "ZERO_DAY", severity: "HIGH" },
  { keywords: ["breach", "leak", "exposed", "million records"], category: "BREAKING_BREACH", severity: "HIGH" },
  { keywords: ["apt", "nation-state", "lazarus", "apt29", "apt28"], category: "APT", severity: "HIGH" },
  { keywords: ["darknet", "underground", "dark web marketplace"], category: "DARKNET", severity: "MEDIUM" },
  { keywords: ["data leak", "misconfigur"], category: "DATA_LEAK", severity: "MEDIUM" },
  { keywords: ["patch", "mitigation", "hardening", "defense"], category: "CYBER_DEFENSE", severity: "LOW" },
];

export function classifyArticle(text: string): { category: Category; severity: Severity } {
  const lower = text.toLowerCase();
  for (const rule of RULES) {
    if (rule.keywords.some((k) => lower.includes(k))) {
      return { category: rule.category, severity: rule.severity };
    }
  }
  return { category: "THREAT_INTEL", severity: "MEDIUM" };
}

export function estimateReadTime(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(3, Math.min(12, Math.ceil(words / 180)));
}
