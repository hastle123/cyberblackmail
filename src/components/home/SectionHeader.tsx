import { Link } from "@/i18n/navigation";
import { editorial } from "@/lib/editorial";

export function SectionHeader({
  label,
  title,
  href,
  linkLabel,
}: {
  label?: string;
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="h-6 w-1 shrink-0 rounded-full bg-accent" aria-hidden />
        <div>
          {label && <p className={`mb-1 ${editorial.sectionLabel}`}>{label}</p>}
          <h2 className={editorial.sectionTitle}>{title}</h2>
        </div>
      </div>
      {href && linkLabel && (
        <Link
          href={href}
          className="group inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-xs font-medium text-fg-3 transition-colors hover:border-line-strong hover:bg-white/[0.03] hover:text-fg"
        >
          {linkLabel}
          <span className="transition-transform group-hover:translate-x-0.5" aria-hidden>
            →
          </span>
        </Link>
      )}
    </div>
  );
}
