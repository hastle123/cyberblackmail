/** Browser-like headers — some feeds (The Record / Cloudflare) block bot User-Agents. */
export const RSS_PARSER_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
  Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

/** Retired feed URLs — deactivated on ensure*() so stale DB rows don't error every ingest. */
export const RETIRED_RSS_URLS = [
  "https://www.ftc.gov/news-events/topics/consumer-alerts/feed",
  "https://therecord.media/feed/",
] as const;
