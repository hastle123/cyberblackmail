import { getTranslations } from "next-intl/server";
import { IntelShell } from "@/components/layout/IntelShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { IOCExplorer } from "@/components/intel/IOCExplorer";
import { getIOCs } from "@/lib/data";

export async function generateMetadata() {
  const t = await getTranslations("iocsPage");
  return { title: t("title") };
}

export default async function IOCsPage() {
  const t = await getTranslations("iocsPage");
  const iocs = await getIOCs();

  return (
    <IntelShell maxWidth="wide">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <IOCExplorer iocs={iocs} />
    </IntelShell>
  );
}
