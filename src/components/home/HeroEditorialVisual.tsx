import { editorial } from "@/lib/editorial";

/** Editorial hero fallback when no cover image — newsroom graphic, not empty black */
export function HeroEditorialVisual({
  categoryLabel,
  headline,
}: {
  categoryLabel: string;
  headline: string;
}) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#101010]">
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a]/80 via-transparent to-[#050505]/90" />

      {/* Accent rule */}
      <div className="absolute left-0 top-0 h-full w-[3px] bg-[#b91c1c]/80" />

      {/* Category */}
      <div className="absolute left-6 top-6 md:left-8 md:top-8">
        <span className={editorial.sectionLabel}>{categoryLabel}</span>
      </div>

      {/* Headline watermark — fills the void */}
      <p
        className="absolute inset-x-6 bottom-16 top-20 flex items-center font-serif text-[1.65rem] font-semibold leading-[1.15] tracking-tight text-white/[0.12] md:inset-x-8 md:text-[2rem] lg:text-[2.25rem]"
        aria-hidden
      >
        {headline}
      </p>

      {/* Static map markers — no glow */}
      <div className="pointer-events-none absolute inset-0 opacity-50">
        <span className="absolute left-[22%] top-[38%] h-1.5 w-1.5 rounded-full bg-[#b91c1c]" />
        <span className="absolute left-[48%] top-[52%] h-1 w-1 rounded-full bg-[#737373]" />
        <span className="absolute left-[68%] top-[32%] h-1.5 w-1.5 rounded-full bg-[#b91c1c]" />
        <span className="absolute left-[55%] top-[68%] h-1 w-1 rounded-full bg-[#525252]" />
      </div>

      {/* Bottom fade for badges */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#090909] to-transparent" />
    </div>
  );
}
