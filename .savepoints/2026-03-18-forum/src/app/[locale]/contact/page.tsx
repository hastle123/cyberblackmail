import { getTranslations } from "next-intl/server";
import { IntelShell } from "@/components/layout/IntelShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { ContactForm } from "@/components/layout/ContactForm";

export async function generateMetadata() {
  const t = await getTranslations("contactPage");
  return { title: t("title") };
}

export default async function ContactPage() {
  const t = await getTranslations("contactPage");

  return (
    <IntelShell maxWidth="default">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <div className="mx-auto max-w-lg">
        <ContactForm />
      </div>
    </IntelShell>
  );
}
