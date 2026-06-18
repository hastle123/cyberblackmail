import { getTranslations } from "next-intl/server";
import { cn } from "@/lib/constants";
import { editorial } from "@/lib/editorial";

export type ThreatAnalysisData = {
  executiveSummary: string;
  attackVector: string;
  impact: string;
  targetIndustry: string;
  mitigations: string[] | unknown;
};

type ThreatAnalysisPanelProps = {
  analysis: ThreatAnalysisData;
  className?: string;
};

function normalizeMitigations(mitigations: string[] | unknown): string[] {
  if (Array.isArray(mitigations)) return mitigations.filter((m) => typeof m === "string");
  if (mitigations && typeof mitigations === "object" && !Array.isArray(mitigations)) {
    const obj = mitigations as { immediate?: string[]; strategic?: string[] };
    return [...(obj.immediate ?? []), ...(obj.strategic ?? [])];
  }
  return [];
}

export async function ThreatAnalysisPanel({ analysis, className }: ThreatAnalysisPanelProps) {
  const t = await getTranslations("analysis");
  const mitigations = normalizeMitigations(analysis.mitigations);

  return (
    <div className={cn("space-y-4", className)}>
      <Section title={t("executiveSummary")}>
        <p className="text-sm leading-relaxed text-[#c9d1d9]">{analysis.executiveSummary}</p>
      </Section>

      <div className="grid gap-4 md:grid-cols-2">
        <Section title={t("attackVector")}>
          <p className="text-sm leading-relaxed text-[#c9d1d9]">{analysis.attackVector}</p>
        </Section>

        <Section title={t("impact")}>
          <p className="text-sm leading-relaxed text-[#c9d1d9]">{analysis.impact}</p>
        </Section>
      </div>

      <Section title={t("targetIndustry")}>
        <p className="text-sm text-[#d4d4d4]">{analysis.targetIndustry}</p>
      </Section>

      {mitigations.length > 0 && (
        <Section title={t("mitigations")}>
          <ul className="space-y-2">
            {mitigations.map((item, i) => (
              <li key={i} className="flex gap-2 text-sm text-[#c9d1d9]">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c41e1e]" />
                {item}
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={`${editorial.card} p-4`}>
      <h3 className={editorial.sectionTitle}>{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}
