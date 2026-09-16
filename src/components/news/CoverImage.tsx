"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/constants";

/** <img> that swaps to a fallback, then to a styled placeholder, when the source fails. */
export function CoverImage({
  src,
  fallback,
  alt = "",
  className,
  eager = false,
}: {
  src: string;
  fallback?: string;
  alt?: string;
  className?: string;
  eager?: boolean;
}) {
  const ref = useRef<HTMLImageElement>(null);
  const [current, setCurrent] = useState(src);
  const [failed, setFailed] = useState(false);

  const handleError = () => {
    if (fallback && current !== fallback) setCurrent(fallback);
    else setFailed(true);
  };

  // An image can fail before hydration attaches onError
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) handleError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (failed) return <div className={cn("cover-fallback", className)} aria-hidden />;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={current}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onError={handleError}
      className={className}
    />
  );
}
