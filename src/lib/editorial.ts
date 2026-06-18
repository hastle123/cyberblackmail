/** Premium newsroom design tokens */

export const editorial = {
  kicker: "text-[10px] font-semibold uppercase tracking-[0.22em] text-[#b91c1c]",
  sectionTitle:
    "font-serif text-lg font-semibold tracking-tight text-[#f5f5f5] md:text-xl",
  sectionLabel:
    "text-[10px] font-bold uppercase tracking-[0.18em] text-[#b91c1c]",
  pageTitle:
    "font-serif text-3xl font-bold tracking-tight text-[#fafafa] md:text-4xl lg:text-[2.75rem] lg:leading-[1.1]",
  heroTitle:
    "font-serif text-3xl font-bold leading-[1.08] tracking-tight text-[#fafafa] md:text-[2.5rem] lg:text-5xl lg:leading-[1.05]",
  heading: "font-serif text-[#f5f5f5]",
  cardTitle: "font-serif text-lg font-semibold leading-snug text-[#f0f0f0] md:text-xl",
  cardTitleSm: "font-serif text-base font-semibold leading-snug text-[#ececec]",
  byline: "text-[11px] font-medium uppercase tracking-[0.12em] text-[#737373]",
  body: "text-[15px] leading-[1.65] text-[#a3a3a3]",
  bodySm: "text-sm leading-relaxed text-[#8a8a8a]",
  meta: "text-xs text-[#6b6b6b]",
  card: "news-card rounded-sm",
  panel: "news-panel rounded-sm",
  link: "intel-link",
  navLink:
    "relative px-3 py-2 text-[11px] font-medium uppercase tracking-[0.14em] transition-colors",
  navLinkActive:
    "text-[#fafafa] after:absolute after:inset-x-2 after:-bottom-px after:h-[2px] after:bg-[#b91c1c]",
  navLinkIdle: "text-[#8a8a8a] hover:text-[#e5e5e5]",
  input:
    "rounded-sm border border-white/[0.08] bg-[#161616] px-3 py-2 text-sm text-[#d4d4d4] outline-none focus:border-[#b91c1c]/35",
  tag: "rounded-sm border border-[#b91c1c]/20 bg-[#b91c1c]/[0.06] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[#dc2626]",
  breaking:
    "rounded-sm bg-[#b91c1c] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-white",
} as const;

export function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}
