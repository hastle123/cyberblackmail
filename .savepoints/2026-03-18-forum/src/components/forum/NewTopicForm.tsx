"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { editorial } from "@/lib/editorial";

type Category = { slug: string; name: string };

type NewTopicFormProps = {
  categories: Category[];
};

export function NewTopicForm({ categories }: NewTopicFormProps) {
  const t = useTranslations("forumPage");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const payload = {
      title: String(form.get("title") ?? ""),
      content: String(form.get("content") ?? ""),
      authorName: String(form.get("authorName") ?? ""),
      categorySlug: String(form.get("categorySlug") ?? ""),
    };

    try {
      const res = await fetch("/api/forum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? t("createError"));
        return;
      }
      router.push(`/forum/${json.data.slug}`);
      router.refresh();
    } catch {
      setError(t("createError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className={`${editorial.card} space-y-4 rounded-lg p-6`}>
      {error && (
        <p className="rounded border border-[#c41e1e]/30 bg-[#c41e1e]/10 px-3 py-2 text-sm text-[#e52525]">
          {error}
        </p>
      )}

      <div>
        <label htmlFor="categorySlug" className={editorial.byline}>
          {t("category")}
        </label>
        <select
          id="categorySlug"
          name="categorySlug"
          required
          className={`mt-1.5 w-full ${editorial.input}`}
          defaultValue={categories[0]?.slug}
        >
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="title" className={editorial.byline}>
          {t("topicTitle")}
        </label>
        <input id="title" name="title" required maxLength={200} className={`mt-1.5 w-full ${editorial.input}`} />
      </div>

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
          rows={8}
          maxLength={10000}
          className={`mt-1.5 w-full resize-y ${editorial.input}`}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded bg-[#c41e1e] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#e52525] disabled:opacity-50"
      >
        {loading ? t("posting") : t("postTopic")}
      </button>
    </form>
  );
}
