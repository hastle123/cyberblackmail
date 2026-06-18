import { cn } from "@/lib/constants";

type IntelShellProps = {
  children: React.ReactNode;
  className?: string;
  maxWidth?: "default" | "wide" | "full";
};

const maxWidthClasses = {
  default: "max-w-6xl",
  wide: "max-w-6xl",
  full: "max-w-none",
};

export function IntelShell({
  children,
  className,
  maxWidth = "default",
}: IntelShellProps) {
  return (
    <div className={cn("mx-auto w-full px-4 py-6 lg:px-6 lg:py-8", maxWidthClasses[maxWidth], className)}>
      {children}
    </div>
  );
}
