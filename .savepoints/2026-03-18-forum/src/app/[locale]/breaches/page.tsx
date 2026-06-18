import { getTranslations } from "next-intl/server";
import { IntelShell } from "@/components/layout/IntelShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { BreachSearchTable } from "@/components/intel/BreachSearchTable";
import { getBreaches } from "@/lib/data";
import { jsonArray } from "@/lib/constants";

export async function generateMetadata() {
  const t = await getTranslations("breachesPage");
  return { title: t("title") };
}

export default async function BreachesPage() {
  const t = await getTranslations("breachesPage");
  const breaches = await getBreaches();

  return (
    <IntelShell maxWidth="wide">
      <PageHeader title={t("title")} subtitle={t("subtitle", { count: breaches.length })} />
      <BreachSearchTable
        breaches={breaches.map((b) => ({
          ...b,
          dataTypes: jsonArray(b.dataTypes),
        }))}
      />
    </IntelShell>
  );
}
