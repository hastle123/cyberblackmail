"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { editorial } from "@/lib/editorial";
import { cn } from "@/lib/constants";
import {
  SCAM_PLATFORM_GROUPS,
  SCAM_PLATFORMS,
  SCAM_TOPICS,
} from "@/lib/scams";

export function ScamsFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const t = useTranslations("scamsPage");
  const topic = params.get("topic") ?? "";
  const platform = params.get("platform") ?? "";
  const group = params.get("group") ?? "";
  const search = params.get("search") ?? "";

  const visiblePlatforms = group
    ? SCAM_PLATFORMS.filter((p) => p.group === group)
    : SCAM_PLATFORMS;

  const navigate = (next: { topic?: string; platform?: string; group?: string }) => {
    const qs = new URLSearchParams();
    const nextTopic = next.topic ?? topic;
    const nextPlatform = next.platform ?? platform;
    const nextGroup = next.group ?? group;
    if (nextTopic) qs.set("topic", nextTopic);
    if (nextPlatform) qs.set("platform", nextPlatform);
    if (nextGroup) qs.set("group", nextGroup);
    if (search) qs.set("search", search);
    const str = qs.toString();
    router.push(str ? `/scams?${str}` : "/scams");
  };

  const updateSearch = (value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set("search", value);
    else next.delete("search");
    router.push(`/scams?${next.toString()}`);
  };

  const chipClass = (active: boolean) =>
    cn(
      "rounded-sm border px-3 py-1.5 text-[11px] font-medium uppercase tracking-wide transition-colors",
      active
        ? "border-[#e52525]/40 bg-[#e52525]/10 text-[#f87171]"
        : "border-white/[0.08] bg-[#121212] text-[#8a8a8a] hover:border-white/[0.14] hover:text-[#d4d4d4]",
    );

  const platformChipClass = (active: boolean) =>
    cn(
      "rounded-sm border px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide transition-colors",
      active
        ? "border-[#e52525]/40 bg-[#e52525]/10 text-[#f87171]"
        : "border-white/[0.08] bg-[#121212] text-[#8a8a8a] hover:border-white/[0.14] hover:text-[#d4d4d4]",
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => navigate({ topic: "" })} className={chipClass(!topic)}>
          {t("allTopics")}
        </button>
        {SCAM_TOPICS.map(({ id }) => (
          <button
            key={id}
            type="button"
            onClick={() => navigate({ topic: topic === id ? "" : id })}
            className={chipClass(topic === id)}
          >
            {t(`topics.${id}`)}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => navigate({ group: "", platform: "" })}
          className={chipClass(!group)}
        >
          {t("allGroups")}
        </button>
        {SCAM_PLATFORM_GROUPS.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() =>
              navigate({
                group: group === g ? "" : g,
                platform: "",
              })
            }
            className={chipClass(group === g)}
          >
            {t(`groups.${g}`)}
          </button>
        ))}
      </div>

      <div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto pr-1">
        {visiblePlatforms.map((p) => (
          <button
            key={p.slug}
            type="button"
            onClick={() =>
              navigate({
                platform: platform === p.slug ? "" : p.slug,
                group: p.group,
              })
            }
            className={platformChipClass(platform === p.slug)}
          >
            {p.name}
          </button>
        ))}
      </div>

      <input
        type="search"
        defaultValue={search}
        placeholder={t("searchPlaceholder")}
        onKeyDown={(e) => {
          if (e.key === "Enter") updateSearch((e.target as HTMLInputElement).value);
        }}
        className={`max-w-md ${editorial.input}`}
      />
    </div>
  );
}
