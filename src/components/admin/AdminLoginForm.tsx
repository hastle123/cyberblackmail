"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/admin";

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Login failed");
        return;
      }

      router.replace(next.startsWith("/admin") ? next : "/admin");
      router.refresh();
    } catch {
      setError("Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="glass-panel mx-auto max-w-sm rounded-xl p-6">
      <h1 className="font-serif text-xl font-semibold text-[#f0f0f0]">Admin sign in</h1>
      <p className="mt-2 text-sm text-[#888]">Restricted area. Authorized access only.</p>
      {error && <p className="mt-4 text-sm text-[#e52525]">{error}</p>}
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
        className="mt-4 w-full rounded border border-white/10 bg-[#141414] px-3 py-2 text-sm text-[#f0f0f0]"
        placeholder="Password"
        required
      />
      <button
        type="submit"
        disabled={loading}
        className="mt-4 w-full rounded bg-[#c41e1e] py-2.5 text-sm font-semibold text-white hover:bg-[#e52525] disabled:opacity-50"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
