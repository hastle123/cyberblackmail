import Link from "next/link";

export default function RootNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] px-4 text-center">
      <p className="font-mono text-6xl font-bold text-[#e52525]">404</p>
      <h1 className="mt-4 font-serif text-lg text-[#f0f0f0]">Page not found</h1>
      <Link
        href="/"
        className="mt-6 rounded border border-[#c41e1e]/30 bg-[#c41e1e]/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#e52525] hover:bg-[#c41e1e]/20"
      >
        Back home
      </Link>
    </div>
  );
}
