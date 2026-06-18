import { Link } from "@/i18n/navigation";
import { editorial } from "@/lib/editorial";

export function SectionHeader({
  label,
  title,
  href,
  linkLabel,
}: {
  label: string;
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-white/[0.06] pb-4">
      <div>
        <p className={editorial.sectionLabel}>{label}</p>
        <h2 className={`mt-1 ${editorial.sectionTitle}`}>{title}</h2>
      </div>
      {href && linkLabel && (
        <Link
          href={href}
          className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a8a8a] transition-colors hover:text-[#dc2626]"
        >
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}
