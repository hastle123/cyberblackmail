import { Link } from "@/i18n/navigation";
import { formatDistanceToNow } from "date-fns";
import { ru, enUS } from "date-fns/locale";
import { editorial } from "@/lib/editorial";

export type ForumTopicRow = {
  slug: string;
  title: string;
  authorName: string;
  isPinned: boolean;
  viewCount: number;
  createdAt: Date;
  lastReplyAt: Date | null;
  category: { slug: string; name: string };
  _count: { posts: number };
};

type ForumTopicTableProps = {
  topics: ForumTopicRow[];
  locale: string;
  labels: {
    topic: string;
    category: string;
    replies: string;
    views: string;
    lastActivity: string;
    pinned: string;
    by: string;
    empty: string;
  };
};

export function ForumTopicTable({ topics, locale, labels }: ForumTopicTableProps) {
  const dateLocale = locale === "ru" ? ru : enUS;

  if (topics.length === 0) {
    return (
      <div className={`${editorial.card} rounded-lg px-6 py-12 text-center ${editorial.body}`}>
        {labels.empty}
      </div>
    );
  }

  return (
    <div className={`${editorial.card} overflow-hidden rounded-lg`}>
      <table className="data-table">
        <thead>
          <tr>
            <th>{labels.topic}</th>
            <th className="hidden sm:table-cell">{labels.category}</th>
            <th className="text-right">{labels.replies}</th>
            <th className="hidden md:table-cell text-right">{labels.views}</th>
            <th className="hidden lg:table-cell text-right">{labels.lastActivity}</th>
          </tr>
        </thead>
        <tbody>
          {topics.map((topic) => (
            <tr key={topic.slug} className="border-t border-white/[0.05]">
              <td className="py-3 pr-4">
                <div className="flex flex-wrap items-center gap-2">
                  {topic.isPinned && (
                    <span className={editorial.tag}>{labels.pinned}</span>
                  )}
                  <Link href={`/forum/${topic.slug}`} className="intel-link font-medium text-[#e8e8e8]">
                    {topic.title}
                  </Link>
                </div>
                <p className={`mt-1 ${editorial.meta}`}>
                  {labels.by} {topic.authorName}
                </p>
              </td>
              <td className="hidden sm:table-cell">
                <Link
                  href={`/forum?category=${topic.category.slug}`}
                  className="text-xs text-[#a3a3a3] hover:text-[#e52525]"
                >
                  {topic.category.name}
                </Link>
              </td>
              <td className="text-right tabular-nums text-[#a3a3a3]">{topic._count.posts}</td>
              <td className="hidden md:table-cell text-right tabular-nums text-[#6b6b6b]">
                {topic.viewCount}
              </td>
              <td className="hidden lg:table-cell text-right text-xs text-[#6b6b6b]">
                {formatDistanceToNow(topic.lastReplyAt ?? topic.createdAt, {
                  addSuffix: true,
                  locale: dateLocale,
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
