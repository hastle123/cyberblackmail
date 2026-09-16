import { Inter_Tight } from "next/font/google";
import { cn } from "@/lib/constants";

const brandFont = Inter_Tight({ subsets: ["latin"], weight: ["800"], display: "swap" });

/**
 * CYBER + BLACKMAIL on a red "redaction" plate. Size it with a text-[…] class;
 * every dimension is in em so it scales as one piece.
 */
export function BrandLogo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        brandFont.className,
        "inline-flex items-center font-extrabold uppercase leading-none tracking-[0.14em] text-fg",
        className,
      )}
    >
      <span>Cyber</span>
      {/* Right padding is smaller because tracking already adds space after the last letter */}
      <span className="ml-[0.26em] rounded-[0.12em] bg-accent py-[0.28em] pl-[0.4em] pr-[0.26em] text-[#0b0b0e] transition-colors duration-300 group-hover:bg-accent-strong">
        Blackmail
      </span>
    </span>
  );
}
