"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { editorial } from "@/lib/editorial";

export function ContactForm() {
  const t = useTranslations("contactPage");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className={`${editorial.panel} p-8 text-center`}>
        <p className="text-sm text-[#e52525]">{t("successTitle")}</p>
        <p className={`mt-2 ${editorial.body}`}>{t("successBody")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`${editorial.panel} space-y-4 p-6`}>
      <div>
        <label className={editorial.byline}>{t("name")}</label>
        <input required name="name" className={`mt-1 w-full ${editorial.input}`} />
      </div>
      <div>
        <label className={editorial.byline}>{t("email")}</label>
        <input required type="email" name="email" className={`mt-1 w-full ${editorial.input}`} />
      </div>
      <div>
        <label className={editorial.byline}>{t("organization")}</label>
        <input name="organization" className={`mt-1 w-full ${editorial.input}`} />
      </div>
      <div>
        <label className={editorial.byline}>{t("message")}</label>
        <textarea required name="message" rows={5} className={`mt-1 w-full ${editorial.input}`} />
      </div>
      <button
        type="submit"
        className="w-full rounded-lg border border-[#c41e1e]/30 bg-[#c41e1e]/12 py-3 text-xs font-semibold uppercase tracking-wider text-[#e52525] transition hover:bg-[#c41e1e]/20"
      >
        {t("submit")}
      </button>
    </form>
  );
}
