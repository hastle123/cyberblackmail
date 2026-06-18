"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { formatDate } from "@/lib/constants";
import { editorial } from "@/lib/editorial";
import { SeverityBadge } from "@/components/intel/SeverityBadge";
import type { Category, Severity } from "@prisma/client";

type SearchResults = {
  articles: {
    id: string;
    slug: string;
    title: string;
    titleRu?: string | null;
    excerpt: string;
    severity: Severity;
    category: Category;
    publishedAt: string;
  }[];
  iocs: { id: string; type: string; value: string; threatLevel: Severity }[];
  actors: { id: string; slug: string; name: string; type: string; threatLevel: Severity }[];
  companies: { id: string; slug: string; name: string; industry: string; intelligenceScore: number }[];
  breaches: { id: string; organization: string; recordsExposed: string; severity: Severity; breachDate: string }[];
  cves: { id: string; cveId: string; severity: Severity; cvssScore: number }[];
  ransomwareGroups: { id: string; slug: string; name: string; status: string; victimCount: number }[];
};

type GlobalSearchProps = {
  open: boolean;
  onClose: () => void;
};

export function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const locale = useLocale();
  const t = useTranslations("searchUi");
  const tCat = useTranslations("category");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      setResults(json.data ?? null);
    } catch {
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else {
      setQuery("");
      setResults(null);
    }
  }, [open]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, search]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const hasResults =
    results &&
    Object.values(results).some((arr) => Array.isArray(arr) && arr.length > 0);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-x-4 top-[12vh] z-[91] mx-auto max-w-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div
              className={`${editorial.panel} overflow-hidden shadow-2xl shadow-black/50`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 border-b border-white/8 px-4 py-3">
                <svg className="h-5 w-5 shrink-0 text-[#888]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("placeholder")}
                  className="flex-1 bg-transparent text-sm text-[#f0f0f0] outline-none placeholder:text-[#6b6b6b]"
                />
                <kbd className={`hidden rounded border border-white/10 bg-[#141414] px-2 py-0.5 text-[10px] text-[#888] sm:inline ${editorial.meta}`}>
                  ESC
                </kbd>
              </div>
              <div className="max-h-[60vh] overflow-y-auto p-2">
                {loading && (
                  <p className={`px-3 py-8 text-center text-xs text-[#888] ${editorial.meta}`}>
                    {t("scanning")}
                  </p>
                )}
                {!loading && query && !hasResults && (
                  <p className={`px-3 py-8 text-center text-xs text-[#888] ${editorial.meta}`}>
                    {t("noResults")}
                  </p>
                )}
                {!loading && !query && (
                  <p className={`px-3 py-8 text-center text-xs text-[#555] ${editorial.meta}`}>
                    {t("noQuery")}
                  </p>
                )}
                {!loading && hasResults && (
                  <div className="space-y-2">
                    {results!.articles.length > 0 && (
                      <ResultSection title={t("sections.articles")}>
                        {results!.articles.map((a) => {
                          const title =
                            locale === "ru" && a.titleRu && a.titleRu !== a.title ? a.titleRu : a.title;
                          return (
                          <Link key={a.id} href={`/intel/${a.slug}`} onClick={onClose} className="block rounded-lg px-3 py-2 hover:bg-[#c41e1e]/8">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm text-[#d4d4d4]">{title}</p>
                                <p className="mt-0.5 text-xs text-[#888]">
                                  {tCat(a.category)} · {formatDate(a.publishedAt)}
                                </p>
                              </div>
                              <SeverityBadge severity={a.severity} />
                            </div>
                          </Link>
                          );
                        })}
                      </ResultSection>
                    )}
                    {results!.actors.length > 0 && (
                      <ResultSection title={t("sections.actors")}>
                        {results!.actors.map((a) => (
                          <Link key={a.id} href={`/actors/${a.slug}`} onClick={onClose} className="block rounded-lg px-3 py-2 hover:bg-[#c41e1e]/8">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm text-[#d4d4d4]">{a.name}</p>
                                <p className="text-xs text-[#888]">{a.type}</p>
                              </div>
                              <SeverityBadge severity={a.threatLevel} />
                            </div>
                          </Link>
                        ))}
                      </ResultSection>
                    )}
                    {results!.iocs.length > 0 && (
                      <ResultSection title={t("sections.iocs")}>
                        {results!.iocs.map((i) => (
                          <Link key={i.id} href={`/iocs/${i.id}`} onClick={onClose} className="block rounded-lg px-3 py-2 hover:bg-[#c41e1e]/8">
                            <div className="flex items-center justify-between gap-3">
                              <p className="truncate font-mono text-xs text-[#c41e1e]">{i.value}</p>
                              <SeverityBadge severity={i.threatLevel} />
                            </div>
                          </Link>
                        ))}
                      </ResultSection>
                    )}
                    {results!.cves.length > 0 && (
                      <ResultSection title={t("sections.cves")}>
                        {results!.cves.map((c) => (
                          <Link key={c.id} href={`/vulnerabilities/${c.cveId}`} onClick={onClose} className="block rounded-lg px-3 py-2 hover:bg-[#c41e1e]/8">
                            <div className="flex items-center justify-between gap-3">
                              <p className="font-mono text-sm text-[#d4d4d4]">{c.cveId}</p>
                              <SeverityBadge severity={c.severity} />
                            </div>
                          </Link>
                        ))}
                      </ResultSection>
                    )}
                    {results!.breaches.length > 0 && (
                      <ResultSection title={t("sections.breaches")}>
                        {results!.breaches.map((b) => (
                          <Link key={b.id} href="/breaches" onClick={onClose} className="block rounded-lg px-3 py-2 hover:bg-[#c41e1e]/8">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm text-[#d4d4d4]">{b.organization}</p>
                                <p className="text-xs text-[#888]">{b.recordsExposed} records</p>
                              </div>
                              <SeverityBadge severity={b.severity} />
                            </div>
                          </Link>
                        ))}
                      </ResultSection>
                    )}
                    {results!.ransomwareGroups.length > 0 && (
                      <ResultSection title="Ransomware">
                        {results!.ransomwareGroups.map((r) => (
                          <Link key={r.id} href={`/ransomware/${r.slug}`} onClick={onClose} className="block rounded-lg px-3 py-2 hover:bg-[#c41e1e]/8">
                            <p className="text-sm text-[#d4d4d4]">{r.name}</p>
                            <p className="text-xs text-[#888]">{r.victimCount} victims · {r.status}</p>
                          </Link>
                        ))}
                      </ResultSection>
                    )}
                    {results!.companies.length > 0 && (
                      <ResultSection title={t("sections.companies")}>
                        {results!.companies.map((c) => (
                          <Link key={c.id} href={`/companies/${c.slug}`} onClick={onClose} className="block rounded-lg px-3 py-2 hover:bg-[#c41e1e]/8">
                            <p className="text-sm text-[#d4d4d4]">{c.name}</p>
                            <p className="text-xs text-[#888]">{c.industry}</p>
                          </Link>
                        ))}
                      </ResultSection>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function useGlobalSearch() {
  const [open, setOpen] = useState(false);
  return {
    open,
    openSearch: () => setOpen(true),
    closeSearch: () => setOpen(false),
    toggleSearch: () => setOpen((v) => !v),
  };
}

function ResultSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-2">
      <p className={`px-3 py-1.5 ${editorial.sectionTitle}`}>{title}</p>
      {children}
    </div>
  );
}
