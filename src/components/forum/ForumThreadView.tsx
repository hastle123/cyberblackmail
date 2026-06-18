import { format } from "date-fns";
import { ru, enUS } from "date-fns/locale";
import { Link } from "@/i18n/navigation";
import { ReplyForm } from "@/components/forum/ReplyForm";
import { editorial } from "@/lib/editorial";

type Post = {
  id: string;
  authorName: string;
  content: string;
  createdAt: Date;
};

type ForumThreadViewProps = {
  topic: {
    slug: string;
    title: string;
    content: string;
    authorName: string;
    createdAt: Date;
    viewCount: number;
    status: string;
    category: { slug: string; name: string };
    posts: Post[];
    _count: { posts: number };
  };
  locale: string;
  labels: {
    by: string;
    replies: string;
    views: string;
    category: string;
    originalPost: string;
  };
};

export function ForumThreadView({ topic, locale, labels }: ForumThreadViewProps) {
  const dateLocale = locale === "ru" ? ru : enUS;
  const closed = topic.status === "LOCKED" || topic.status === "ARCHIVED";

  return (
    <div className="space-y-6">
      <article className={`${editorial.card} rounded-lg p-6`}>
        <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-[#6b6b6b]">
          <Link href={`/forum?category=${topic.category.slug}`} className="hover:text-[#e52525]">
            {topic.category.name}
          </Link>
          <span>·</span>
          <span>
            {labels.by} {topic.authorName}
          </span>
          <span>·</span>
          <span>{format(topic.createdAt, "PPp", { locale: dateLocale })}</span>
          <span>·</span>
          <span>
            {topic._count.posts} {labels.replies}
          </span>
          <span>·</span>
          <span>
            {topic.viewCount} {labels.views}
          </span>
        </div>

        <h1 className="font-serif text-2xl font-bold tracking-tight text-[#f0f0f0] md:text-3xl">
          {topic.title}
        </h1>

        <div className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-[#c8c8c8]">
          {topic.content}
        </div>
      </article>

      {topic.posts.length > 0 && (
        <section className="space-y-3">
          <h2 className={editorial.sectionTitle}>{labels.replies}</h2>
          {topic.posts.map((post) => (
            <div key={post.id} className={`${editorial.card} rounded-lg p-5`}>
              <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-[#6b6b6b]">
                <span className="font-semibold text-[#a3a3a3]">{post.authorName}</span>
                <span>·</span>
                <span>{format(post.createdAt, "PPp", { locale: dateLocale })}</span>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#c8c8c8]">
                {post.content}
              </p>
            </div>
          ))}
        </section>
      )}

      <ReplyForm topicSlug={topic.slug} closed={closed} />
    </div>
  );
}
