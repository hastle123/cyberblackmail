import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { IntelShell } from "@/components/layout/IntelShell";

export default async function NotFound() {
  const t = await getTranslations("notFound");

  return (
    <IntelShell>
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <p className="font-mono text-6xl font-bold text-[#e52525]">404</p>
        <h1 className="mt-4 font-serif text-lg text-[#f0f0f0]">{t("title")}</h1>
        <p className="mt-2 text-sm text-[#a3a3a3]">{t("description")}</p>
        <Link
          href="/"
          className="mt-6 rounded border border-[#c41e1e]/30 bg-[#c41e1e]/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#e52525] hover:bg-[#c41e1e]/20"
        >
          {t("back")}
        </Link>
      </div>
    </IntelShell>
  );
}
