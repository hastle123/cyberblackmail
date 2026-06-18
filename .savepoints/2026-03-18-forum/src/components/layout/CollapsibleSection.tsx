"use client";

import { useState } from "react";
import { editorial } from "@/lib/editorial";

export function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className={`${editorial.card} mb-6 overflow-hidden`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between border-b border-white/[0.07] bg-[#111] px-5 py-3.5 text-left transition-colors hover:bg-[#141414]"
      >
        <span className={editorial.sectionTitle}>{title}</span>
        <span className="text-sm text-[#666] transition-transform duration-200" aria-hidden>
          {open ? "−" : "+"}
        </span>
      </button>
      {open && <div className="p-5">{children}</div>}
    </section>
  );
}
