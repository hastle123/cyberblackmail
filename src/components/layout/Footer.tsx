import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Wordmark } from "@/components/layout/Wordmark";
import { editorial } from "@/lib/editorial";

export async function Footer() {
  const t = await getTranslations("footer");
  const year = new Date().getFullYear();

  const sections = [
    {
      title: t("coverage"),
      links: [
        { href: "/intel", label: t("latest") },
        { href: "/breaches", label: t("breaches") },
        { href: "/ransomware", label: t("ransomware") },
        { href: "/vulnerabilities", label: t("vulnerabilities") },
      ],
    },
    {
      title: t("intel"),
      links: [
        { href: "/forum", label: t("forum") },
        { href: "/actors", label: t("actors") },
        { href: "/alerts", label: t("alerts") },
        { href: "/threat-map", label: t("threatMap") },
        { href: "/briefing", label: t("briefing") },
      ],
    },
    {
      title: t("company"),
      links: [
        { href: "/about", label: t("about") },
        { href: "/contact", label: t("contact") },
      ],
    },
  ] as const;

  return (
    <footer className="mt-16 border-t border-white/[0.07] bg-[#080808]">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.2fr_2fr]">
          <div>
            <Wordmark />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#6b6b6b]">{t("blurb")}</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {sections.map((section) => (
              <div key={section.title}>
                <h3 className={editorial.sectionTitle}>{section.title}</h3>
                <ul className="mt-3 space-y-2">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-[#a3a3a3] transition-colors hover:text-[#e52525]"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.06] pt-6">
          <p className="text-xs text-[#555]">
            © {year} CyberBlackmail. {t("rights")}
          </p>
          <p className="text-xs text-[#555]">{t("disclaimer")}</p>
        </div>
      </div>
    </footer>
  );
}
