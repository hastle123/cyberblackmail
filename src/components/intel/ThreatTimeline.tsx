"use client";

import { useLocale, useTranslations } from "next-intl";
import { cn, formatDate } from "@/lib/constants";
import type { TimelineStage } from "@prisma/client";

export type TimelineEvent = {
  id: string;
  stage: TimelineStage;
  timestamp: Date | string;
  title: string;
  description: string;
  order: number;
};

type ThreatTimelineProps = {
  events: TimelineEvent[];
  actorNames?: string[];
  className?: string;
};

const stageColors: Record<TimelineStage, string> = {
  INITIAL_ACCESS: "#c41e1e",
  RECONNAISSANCE: "#8b1515",
  PRIVILEGE_ESCALATION: "#a03030",
  LATERAL_MOVEMENT: "#c41e1e",
  DATA_EXFILTRATION: "#e52525",
  RANSOM_DEMAND: "#a03030",
  RESOLUTION: "#6b6b6b",
};

export function ThreatTimeline({ events, actorNames = [], className }: ThreatTimelineProps) {
  const locale = useLocale();
  const t = useTranslations("timeline");
  const sorted = [...events].sort((a, b) => a.order - b.order);
  const actor = actorNames[0] ?? (locale === "ru" ? "неизвестной группировки" : "unknown");

  const localizedEvent = (event: TimelineEvent) => {
    if (locale !== "ru") {
      return { title: event.title, description: event.description };
    }
    if (event.title.startsWith("Incident phase")) {
      const n = event.title.match(/\d+/)?.[0] ?? String(event.order);
      return { title: t("incidentPhase", { n }), description: event.description };
    }
    const stage = t(`stages.${event.stage}`);
    return {
      title: t("eventTitle", { stage }),
      description: t("eventDescription", { stage, actor }),
    };
  };

  if (sorted.length === 0) {
    return <p className={cn("text-xs text-[#484f58]", className)}>{t("empty")}</p>;
  }

  return (
    <div className={cn("relative overflow-x-auto pb-2", className)}>
      <div className="flex min-w-max items-start gap-0 px-1">
        {sorted.map((event, index) => {
          const color = stageColors[event.stage];
          const isLast = index === sorted.length - 1;
          const { title, description } = localizedEvent(event);

          return (
            <div
              key={event.id}
              className="animate-fade-up relative flex w-48 shrink-0 flex-col items-center"
              style={{ animationDelay: `${index * 40}ms` }}
            >
              {!isLast && (
                <div
                  className="absolute left-[calc(50%+10px)] top-3 h-px w-[calc(100%-20px)] bg-white/[0.08]"
                  aria-hidden
                />
              )}

              <div
                className="relative z-10 flex h-5 w-5 items-center justify-center rounded-full border bg-[#0a0a0a]"
                style={{ borderColor: color }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
              </div>

              <div className="mt-3 w-full px-1 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color }}>
                  {t(`stages.${event.stage}`)}
                </p>
                <time className="mt-1 block text-[10px] text-[#555]">{formatDate(event.timestamp, locale)}</time>
                <h4 className="mt-2 text-xs font-medium leading-snug text-[#d4d4d4]">{title}</h4>
                <p className="mt-1 line-clamp-3 text-[11px] leading-relaxed text-[#777]">{description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
