import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { IntelShell } from "@/components/layout/IntelShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { editorial } from "@/lib/editorial";

export async function generateMetadata() {
  const t = await getTranslations("about");
  return { title: t("title") };
}

export default async function AboutPage() {
  const t = await getTranslations("about");

  const links = [
    { href: "/intel", label: t("linkLatest") },
    { href: "/breaches", label: t("linkBreaches") },
    { href: "/ransomware", label: t("linkRansomware") },
    { href: "/actors", label: t("linkActors") },
    { href: "/threat-map", label: t("linkMap") },
    { href: "/briefing", label: t("linkBriefing") },
  ] as const;

  return (
    <IntelShell>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <div className={`${editorial.card} space-y-8 p-8`}>
        <p className="text-base leading-relaxed text-[#a3a3a3]">{t("intro")}</p>

        <section>
          <h2 className={editorial.sectionTitle}>{t("missionTitle")}</h2>
          <p className="mt-3 text-sm leading-relaxed text-[#888]">{t("mission")}</p>
        </section>

        <section>
          <h2 className={editorial.sectionTitle}>{t("coverageTitle")}</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {links.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={`${editorial.link} text-sm`}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className={editorial.sectionTitle}>{t("sourcesTitle")}</h2>
          <p className="mt-3 text-sm leading-relaxed text-[#888]">{t("sources")}</p>
        </section>
      </div>
    </IntelShell>
  );
}
