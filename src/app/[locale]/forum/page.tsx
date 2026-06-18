import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { IntelShell } from "@/components/layout/IntelShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { ForumTopicTable } from "@/components/forum/ForumTopicTable";
import { getForumCategories, getForumTopics } from "@/lib/data";
import { localizeForumCategory, localizeForumTopic } from "@/lib/localize";
import { editorial } from "@/lib/editorial";
import { cn } from "@/lib/constants";

export async function generateMetadata() {
  const t = await getTranslations("forumPage");
  return { title: t("title") };
}

export default async function ForumPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { locale } = await params;
  const { category: categorySlug } = await searchParams;
  const t = await getTranslations("forumPage");

  const [categories, topics] = await Promise.all([
    getForumCategories(),
    getForumTopics(categorySlug ? { categorySlug } : undefined),
  ]);

  const localizedCategories = categories.map((c) => localizeForumCategory(c, locale));
  const localizedTopics = topics.map((topic) => {
    const loc = localizeForumTopic(topic, locale);
    const cat = localizeForumCategory(topic.category, locale);
    return { ...loc, category: cat };
  });

  const activeCategory = categorySlug
    ? localizedCategories.find((c) => c.slug === categorySlug)
    : null;

  return (
    <IntelShell maxWidth="wide">
      <PageHeader
        title={t("title")}
        subtitle={
          activeCategory
            ? t("categorySubtitle", { name: activeCategory.name })
            : t("subtitle", { count: localizedTopics.length })
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href="/forum"
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider transition-colors",
            !categorySlug
              ? "border-[#c41e1e]/40 bg-[#c41e1e]/10 text-[#e52525]"
              : "border-white/[0.08] text-[#888] hover:border-[#c41e1e]/25 hover:text-[#f0f0f0]",
          )}
        >
          {t("allCategories")}
        </Link>
        {localizedCategories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/forum?category=${cat.slug}`}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider transition-colors",
              categorySlug === cat.slug
                ? "border-[#c41e1e]/40 bg-[#c41e1e]/10 text-[#e52525]"
                : "border-white/[0.08] text-[#888] hover:border-[#c41e1e]/25 hover:text-[#f0f0f0]",
            )}
          >
            {cat.name}
          </Link>
        ))}
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {localizedCategories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/forum?category=${cat.slug}`}
            className={`${editorial.card} block rounded-lg p-4 transition-colors hover:border-[#c41e1e]/25`}
          >
            <h3 className="font-serif text-base font-semibold text-[#f0f0f0]">{cat.name}</h3>
            {cat.description && (
              <p className={`mt-2 line-clamp-2 ${editorial.body}`}>{cat.description}</p>
            )}
            <p className={`mt-3 ${editorial.meta}`}>
              {t("topicsCount", { count: cat._count.topics })}
            </p>
          </Link>
        ))}
      </div>

      <ForumTopicTable
        topics={localizedTopics}
        locale={locale}
        labels={{
          topic: t("colTopic"),
          category: t("colCategory"),
          replies: t("colReplies"),
          views: t("colViews"),
          lastActivity: t("colActivity"),
          pinned: t("pinned"),
          by: t("by"),
          empty: t("empty"),
        }}
      />
    </IntelShell>
  );
}
