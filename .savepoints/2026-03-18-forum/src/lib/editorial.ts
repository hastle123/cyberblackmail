/** Editorial + SOC design tokens */

export const editorial = {
  kicker: "text-[11px] font-bold uppercase tracking-[0.2em] text-[#c41e1e]",
  sectionTitle: "text-[11px] font-bold uppercase tracking-[0.15em] text-[#c41e1e]",
  pageTitle: "font-serif text-2xl font-bold tracking-tight text-[#f0f0f0] md:text-3xl",
  heading: "font-serif text-[#f0f0f0]",
  byline: "text-[11px] font-medium uppercase tracking-wider text-[#6b6b6b]",
  body: "text-sm leading-relaxed text-[#a3a3a3]",
  meta: "text-xs text-[#6b6b6b]",
  card: "editorial-card rounded-lg",
  panel: "soc-panel rounded-lg",
  link: "intel-link",
  navLink:
    "relative rounded px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors",
  navLinkActive:
    "text-[#e52525] after:absolute after:inset-x-1 after:-bottom-[13px] after:h-px after:bg-[#c41e1e]",
  navLinkIdle: "text-[#888] hover:text-[#f0f0f0]",
  input:
    "rounded border border-white/[0.08] bg-[#141414] px-3 py-2 text-sm text-[#d4d4d4] outline-none focus:border-[#c41e1e]/40",
  tag: "rounded border border-[#c41e1e]/25 bg-[#c41e1e]/8 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#e52525]",
} as const;

export function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}
