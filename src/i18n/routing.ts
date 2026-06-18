import { defineRouting } from "next-intl/routing";

/** Flip to `true` to restore /ru, Russian UI, and /ru/forum */
export const RU_LOCALE_ENABLED = false;

export type Locale = "en" | "ru";

const locales: Locale[] = RU_LOCALE_ENABLED ? ["en", "ru"] : ["en"];

export const routing = defineRouting({
  locales,
  defaultLocale: "en",
  localePrefix: "as-needed",
});

export function isSupportedLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}
