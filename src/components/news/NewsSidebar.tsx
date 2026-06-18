import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { editorial } from "@/lib/editorial";
import { formatRelativeTime } from "@/lib/constants";
import { localizeAlert, localizeArticleRef } from "@/lib/localize";
import type { Severity } from "@prisma/client";

type Alert = {
  id: string;
  message: string;
  messageRu?: string | null;
  severity: Severity;
  createdAt: Date | string;
  article?: { slug: string; title: string; titleRu?: string | null } | null;
};

type TrendingArticle = {
  slug: string;
  title: string;
  titleRu?: string | null;
};

function SidebarSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`${editorial.card} overflow-hidden`}>
      <h3 className="border-b border-white/[0.07] bg-[#111] px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest text-[#c41e1e]">
        {title}
      </h3>
      <div className="p-4">{children}</div>
    </section>
  );
}

export async function NewsSidebar({
  alerts,
  trending,
}: {
  alerts: Alert[];
  trending: TrendingArticle[];
}) {
  const locale = await getLocale();
  const t = await getTranslations("sidebar");

  return (
    <aside className="flex flex-col gap-5">
      <SidebarSection title={t("urgent")}>
        <ul className="space-y-3">
          {alerts.slice(0, 3).map((raw) => {
            const alert = localizeAlert(raw, locale);
            const article = raw.article
              ? localizeArticleRef(raw.article, locale)
              : null;
            return (
              <li key={alert.id} className="border-b border-white/[0.04] pb-3 last:border-0 last:pb-0">
                <span className="mb-1 block text-[10px] text-[#555]">
                  {formatRelativeTime(alert.createdAt, locale)}
                </span>
                {article?.slug ? (
                  <Link
                    href={`/intel/${article.slug}`}
                    className="text-sm font-medium leading-snug text-[#d4d4d4] hover:text-[#e52525]"
                  >
                    {alert.message}
                  </Link>
                ) : (
                  <p className="text-sm leading-snug text-[#d4d4d4]">{alert.message}</p>
                )}
              </li>
            );
          })}
        </ul>
        <Link href="/alerts" className={`${editorial.link} mt-3 inline-block text-xs font-semibold uppercase tracking-wider`}>
          {t("allAlerts")} →
        </Link>
      </SidebarSection>

      <SidebarSection title={t("inFocus")}>
        <ol className="space-y-3">
          {trending.slice(0, 5).map((raw, i) => {
            const item = localizeArticleRef(raw, locale);
            return (
              <li key={item.slug} className="flex gap-3">
                <span className="shrink-0 font-serif text-base font-bold text-[#c41e1e]/50">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <Link
                  href={`/intel/${item.slug}`}
                  className="text-sm font-medium leading-snug text-[#e0e0e0] hover:text-[#e52525]"
                >
                  {item.title}
                </Link>
              </li>
            );
          })}
        </ol>
      </SidebarSection>
    </aside>
  );
}
