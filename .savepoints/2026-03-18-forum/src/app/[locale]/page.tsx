import { FeaturedHero } from "@/components/news/FeaturedHero";
import { FeedArticle } from "@/components/news/FeedArticle";
import { NewsSidebar } from "@/components/news/NewsSidebar";
import { getLatestAlerts, getArticles } from "@/lib/data";

export default async function HomePage() {
  const [alerts, feed] = await Promise.all([
    getLatestAlerts(8),
    getArticles({ limit: 20 }),
  ]);

  const [featured, second, third, ...rest] = feed.items;
  const trending = feed.items
    .slice()
    .sort((a, b) => b.intelligenceScore - a.intelligenceScore)
    .slice(0, 5)
    .map(({ slug, title, titleRu }) => ({ slug, title, titleRu }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-6 lg:py-10">
      <div className="grid gap-10 lg:grid-cols-[1fr_280px]">
        <div className="min-w-0">
          {featured && (
            <FeaturedHero
              slug={featured.slug}
              title={featured.title}
              excerpt={featured.excerpt}
              category={featured.category}
              source={featured.source}
              publishedAt={featured.publishedAt}
              readTime={featured.readTime}
              titleRu={featured.titleRu}
              excerptRu={featured.excerptRu}
            />
          )}

          {(second || third) && (
            <div className="mb-6 grid gap-6 border-b border-white/[0.07] pb-8 md:grid-cols-2">
              {second && (
                <FeedArticle
                  slug={second.slug}
                  title={second.title}
                  excerpt={second.excerpt}
                  category={second.category}
                  source={second.source}
                  publishedAt={second.publishedAt}
                  titleRu={second.titleRu}
                  excerptRu={second.excerptRu}
                />
              )}
              {third && (
                <FeedArticle
                  slug={third.slug}
                  title={third.title}
                  excerpt={third.excerpt}
                  category={third.category}
                  source={third.source}
                  publishedAt={third.publishedAt}
                  titleRu={third.titleRu}
                  excerptRu={third.excerptRu}
                />
              )}
            </div>
          )}

          <div className="grid gap-0 md:grid-cols-2 md:gap-x-8">
            <div>
              {rest.slice(0, Math.ceil(rest.length / 2)).map((article) => (
                <FeedArticle
                  key={article.id}
                  slug={article.slug}
                  title={article.title}
                  category={article.category}
                  source={article.source}
                  publishedAt={article.publishedAt}
                  titleRu={article.titleRu}
                  excerptRu={article.excerptRu}
                  compact
                />
              ))}
            </div>
            <div>
              {rest.slice(Math.ceil(rest.length / 2)).map((article) => (
                <FeedArticle
                  key={article.id}
                  slug={article.slug}
                  title={article.title}
                  category={article.category}
                  source={article.source}
                  publishedAt={article.publishedAt}
                  titleRu={article.titleRu}
                  excerptRu={article.excerptRu}
                  compact
                />
              ))}
            </div>
          </div>
        </div>

        <NewsSidebar alerts={alerts} trending={trending} />
      </div>
    </div>
  );
}
