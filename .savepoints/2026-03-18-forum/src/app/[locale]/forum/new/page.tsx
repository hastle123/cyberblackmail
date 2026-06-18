import { getTranslations } from "next-intl/server";
import { IntelShell } from "@/components/layout/IntelShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { NewTopicForm } from "@/components/forum/NewTopicForm";
import { getForumCategories } from "@/lib/data";
import { localizeForumCategory } from "@/lib/localize";

export async function generateMetadata() {
  const t = await getTranslations("forumPage");
  return { title: t("newTopicTitle") };
}

export default async function NewForumTopicPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("forumPage");
  const categories = await getForumCategories();
  const localized = categories.map((c) => localizeForumCategory(c, locale));

  return (
    <IntelShell maxWidth="wide">
      <PageHeader title={t("newTopicTitle")} subtitle={t("newTopicSubtitle")} />
      <div className="max-w-2xl">
        <NewTopicForm categories={localized.map((c) => ({ slug: c.slug, name: c.name }))} />
      </div>
    </IntelShell>
  );
}
