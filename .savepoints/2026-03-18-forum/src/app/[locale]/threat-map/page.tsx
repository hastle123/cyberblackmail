import { getTranslations } from "next-intl/server";
import { IntelShell } from "@/components/layout/IntelShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { AttackMap } from "@/components/map/AttackMap";
import { getMapIncidents } from "@/lib/data";

export async function generateMetadata() {
  const t = await getTranslations("threatMapPage");
  return { title: t("title") };
}

export default async function ThreatMapPage() {
  const t = await getTranslations("threatMapPage");
  const incidents = await getMapIncidents();

  return (
    <IntelShell maxWidth="wide">
      <PageHeader title={t("title")} subtitle={t("subtitle", { count: incidents.length })} />
      <AttackMap incidents={incidents} fullPage />
    </IntelShell>
  );
}
