type BrandFaviconProps = {
  size: number;
  borderRadius: number;
};

/*
 * "CB" drawn as outlines on a 32×32 grid (same shapes as public/icon.svg),
 * so the icon never depends on a web font being available.
 */
const FAVICON_C_PATH = "M14.07 11.75A5.55 5.55 0 1 0 14.07 20.25";
const FAVICON_B_PATH =
  "M17.5 8.75H23.2C26.1 8.75 27.8 10.4 27.8 12.4C27.8 13.9 27 15 25.7 15.5C27.4 16 28.5 17.4 28.5 19.2C28.5 21.6 26.6 23.25 23.6 23.25H17.5ZM20.9 11.5V14.3H22.8C23.9 14.3 24.5 13.8 24.5 12.9C24.5 12 23.9 11.5 22.8 11.5ZM20.9 17V20.4H23.1C24.4 20.4 25.1 19.7 25.1 18.6C25.1 17.6 24.4 17 23.1 17Z";

/** Shared mark for app/icon and app/apple-icon: dark "CB" on the red brand plate. */
export function BrandFavicon({ size, borderRadius }: BrandFaviconProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "#e5262b",
        borderRadius,
      }}
    >
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
        <path d={FAVICON_C_PATH} fill="none" stroke="#0b0b0e" strokeWidth={3.4} />
        <path d={FAVICON_B_PATH} fill="#0b0b0e" fillRule="evenodd" />
      </svg>
    </div>
  );
}
