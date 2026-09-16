/** Premium newsroom design tokens */

export const editorial = {
  kicker: "font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-accent-strong",
  sectionTitle: "font-serif text-xl font-semibold tracking-[-0.01em] text-fg md:text-2xl",
  sectionLabel: "font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-accent-strong",
  pageTitle:
    "font-serif text-3xl font-semibold tracking-[-0.02em] text-fg md:text-4xl lg:text-[2.75rem] lg:leading-[1.08]",
  heroTitle:
    "font-serif text-[2rem] font-semibold leading-[1.08] tracking-[-0.02em] text-white md:text-[2.75rem] lg:text-[3.25rem]",
  heading: "font-serif text-fg",
  cardTitle: "font-serif text-lg font-semibold leading-snug tracking-[-0.01em] text-fg md:text-[1.2rem]",
  cardTitleSm: "font-serif text-[1.05rem] font-semibold leading-snug tracking-[-0.005em] text-fg",
  byline: "text-xs font-medium text-fg-3",
  body: "text-[15px] leading-[1.7] text-fg-2",
  bodySm: "text-sm leading-relaxed text-fg-3",
  meta: "text-xs text-fg-4",
  card: "news-card rounded-xl",
  panel: "news-panel rounded-xl",
  link: "intel-link",
  navLink: "relative rounded-md px-3 py-1.5 text-[13.5px] font-medium transition-colors",
  navLinkActive: "bg-white/[0.07] text-fg",
  navLinkIdle: "text-fg-3 hover:bg-white/[0.04] hover:text-fg",
  input:
    "rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-fg-2 outline-none transition-colors placeholder:text-fg-4 focus:border-accent/50",
  tag: "inline-flex items-center rounded-full border border-white/15 bg-black/40 px-2.5 py-1 text-[10.5px] font-medium text-fg-2 backdrop-blur-md",
  breaking:
    "inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-white",
} as const;

export function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}
