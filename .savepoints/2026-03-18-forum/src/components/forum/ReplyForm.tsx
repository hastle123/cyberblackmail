"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { editorial } from "@/lib/editorial";

type ReplyFormProps = {
  topicSlug: string;
  closed?: boolean;
};

export function ReplyForm({ topicSlug, closed }: ReplyFormProps) {
  const t = useTranslations("forumPage");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (closed) {
    return (
      <p className={`${editorial.card} rounded-lg px-4 py-3 text-sm text-[#6b6b6b]`}>
        {t("topicClosed")}
      </p>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const payload = {
      content: String(form.get("content") ?? ""),
      authorName: String(form.get("authorName") ?? ""),
    };

    try {
      const res = await fetch(`/api/forum/${topicSlug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? t("replyError"));
        return;
      }
      e.currentTarget.reset();
      router.refresh();
    } catch {
      setError(t("replyError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className={`${editorial.card} space-y-4 rounded-lg p-6`}>
      <h2 className="font-serif text-lg font-semibold text-[#f0f0f0]">{t("reply")}</h2>
      {error && (
        <p className="rounded border border-[#c41e1e]/30 bg-[#c41e1e]/10 px-3 py-2 text-sm text-[#e52525]">
          {error}
        </p>
      )}

      <div>
        <label htmlFor="authorName" className={editorial.byline}>
          {t("displayName")}
        </label>
        <input
          id="authorName"
          name="authorName"
          required
          maxLength={60}
          className={`mt-1.5 w-full ${editorial.input}`}
        />
      </div>

      <div>
        <label htmlFor="content" className={editorial.byline}>
          {t("message")}
        </label>
        <textarea
          id="content"
          name="content"
          required
          rows={5}
          maxLength={10000}
          className={`mt-1.5 w-full resize-y ${editorial.input}`}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded bg-[#c41e1e] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#e52525] disabled:opacity-50"
      >
        {loading ? t("posting") : t("postReply")}
      </button>
    </form>
  );
}
