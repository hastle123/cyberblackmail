import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Wordmark } from "@/components/layout/Wordmark";

export async function Footer() {
  const t = await getTranslations("footer");
  const year = new Date().getFullYear();

  const sections = [
    {
      title: t("coverage"),
      links: [
        { href: "/intel", label: t("latest") },
        { href: "/scams", label: t("scams") },
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
    <footer className="relative mt-24 border-t border-line bg-[#050506]">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent"
        aria-hidden
      />
      <div className="mx-auto max-w-7xl px-4 py-14 lg:px-8">
        <div className="grid gap-12 md:grid-cols-[1.1fr_2fr]">
          <div>
            <Wordmark large />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-fg-3">{t("blurb")}</p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {sections.map((section) => (
              <div key={section.title}>
                <h3 className="font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-fg-4">
                  {section.title}
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-fg-2 transition-colors hover:text-fg"
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
        <div className="mt-12 flex flex-col gap-3 border-t border-line pt-6 text-xs text-fg-4 md:flex-row md:items-center md:justify-between">
          <p>
            © {year} CyberBlackmail. {t("rights")}
          </p>
          <p className="max-w-xl md:text-right">{t("disclaimer")}</p>
        </div>
      </div>
    </footer>
  );
}
