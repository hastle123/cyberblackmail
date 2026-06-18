import { defineRouting } from "next-intl/routing";

/** Flip to `true` to restore /ru, Russian UI, and /ru/forum */
export const RU_LOCALE_ENABLED = false;

export const routing = defineRouting({
  locales: RU_LOCALE_ENABLED ? (["en", "ru"] as const) : (["en"] as const),
  defaultLocale: "en",
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
