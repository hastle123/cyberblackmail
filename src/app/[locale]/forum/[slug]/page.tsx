import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { IntelShell } from "@/components/layout/IntelShell";
import { ForumThreadView } from "@/components/forum/ForumThreadView";
import { getForumTopicBySlug, incrementForumTopicViews } from "@/lib/data";
import { localizeForumCategory, localizeForumPost, localizeForumTopic } from "@/lib/localize";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug } = await params;
  const topic = await getForumTopicBySlug(slug);
  if (!topic) return { title: "Forum" };
  return { title: topic.title };
}

export default async function ForumTopicPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = await params;
  const t = await getTranslations("forumPage");

  const raw = await getForumTopicBySlug(slug);
  if (!raw) notFound();

  await incrementForumTopicViews(raw.id);

  const topic = localizeForumTopic(raw, locale);
  const category = localizeForumCategory(raw.category, locale);
  const posts = raw.posts.map((p) => localizeForumPost(p, locale));

  return (
    <IntelShell maxWidth="wide">
      <ForumThreadView
        topic={{
          ...topic,
          category,
          posts,
          viewCount: raw.viewCount + 1,
          _count: raw._count,
        }}
        locale={locale}
        labels={{
          by: t("by"),
          replies: t("replies"),
          views: t("views"),
          category: t("category"),
          originalPost: t("originalPost"),
        }}
      />
    </IntelShell>
  );
}
