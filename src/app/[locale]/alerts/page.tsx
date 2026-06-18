import { getLocale, getTranslations } from "next-intl/server";
import { IntelShell } from "@/components/layout/IntelShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { AlertsList } from "@/components/news/AlertsList";
import { getAllAlerts } from "@/lib/data";
import { localizeAlert } from "@/lib/localize";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata() {
  const t = await getTranslations("alerts");
  return { title: t("title") };
}

export default async function AlertsPage() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("alerts");
  const alerts = (await getAllAlerts()).map((a) => localizeAlert(a, locale));

  return (
    <IntelShell maxWidth="wide">
      <PageHeader title={t("title")} subtitle={t("subtitle", { count: alerts.length })} />
      <AlertsList alerts={alerts} />
    </IntelShell>
  );
}
