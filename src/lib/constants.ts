import { Severity, Category, IOCType, TimelineStage } from "@prisma/client";

export const SEVERITY_COLORS: Record<Severity, string> = {
  CRITICAL: "#e52525",
  HIGH: "#c41e1e",
  MEDIUM: "#8b4040",
  LOW: "#6b6b6b",
};

export const SEVERITY_LABELS: Record<Severity, string> = {
  CRITICAL: "Critical",
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

export const CATEGORY_LABELS: Record<Category, string> = {
  BREAKING_BREACH: "Breach",
  RANSOMWARE: "Ransomware",
  DARKNET: "Dark Web",
  SCAMS: "Scams",
  THREAT_INTEL: "Threat Intel",
  ZERO_DAY: "Zero-Day",
  DATA_LEAK: "Data Leak",
  APT: "APT",
  CYBER_DEFENSE: "Defense",
};

export const CATEGORY_ROUTES: Record<Category, string> = {
  BREAKING_BREACH: "/breaches",
  RANSOMWARE: "/ransomware",
  DARKNET: "/darknet",
  SCAMS: "/scams",
  THREAT_INTEL: "/intel",
  ZERO_DAY: "/vulnerabilities",
  DATA_LEAK: "/breaches",
  APT: "/actors",
  CYBER_DEFENSE: "/intel",
};

export const IOC_TYPE_LABELS: Record<IOCType, string> = {
  IP: "IP Address",
  DOMAIN: "Domain",
  URL: "URL",
  HASH: "Hash",
  EMAIL: "Email",
};

export const TIMELINE_LABELS: Record<TimelineStage, string> = {
  INITIAL_ACCESS: "Initial Access",
  RECONNAISSANCE: "Reconnaissance",
  PRIVILEGE_ESCALATION: "Privilege Escalation",
  LATERAL_MOVEMENT: "Lateral Movement",
  DATA_EXFILTRATION: "Data Exfiltration",
  RANSOM_DEMAND: "Ransom Demand",
  RESOLUTION: "Resolution",
};

export const BRAND = {
  name: "CyberBlackmail",
  tagline: "Cybersecurity News & Threat Intelligence",
  description:
    "Breaking news on cyber attacks, ransomware, data breaches, and global digital threats.",
};

export function formatDate(date: Date | string, locale = "en"): string {
  return new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function formatRelativeTime(date: Date | string, locale = "en"): string {
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return locale === "ru" ? "Только что" : "Just now";
  if (hours < 24) return locale === "ru" ? `${hours} ч назад` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return locale === "ru" ? `${days} дн назад` : `${days}d ago`;
  return formatDate(date, locale);
}

export function scoreColor(score: number): string {
  if (score >= 80) return "#e52525";
  if (score >= 60) return "#c41e1e";
  if (score >= 40) return "#8b4040";
  return "#6b6b6b";
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function jsonArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string");
  return [];
}
