import { ImageResponse } from "next/og";
import { BrandFavicon } from "@/lib/brand-favicon";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<BrandFavicon size={32} borderRadius={7} />, {
    ...size,
  });
}
