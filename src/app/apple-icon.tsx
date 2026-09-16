import { ImageResponse } from "next/og";
import { BrandFavicon } from "@/lib/brand-favicon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<BrandFavicon size={180} borderRadius={36} />, {
    ...size,
  });
}
