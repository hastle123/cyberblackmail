import {
  getLatestAlerts,
  getArticles,
  getScamArticles,
  getActors,
  getCVEs,
  getRansomwareGroups,
  getCountries,
  getIndustries,
  getMapIncidents,
  getPlatformStats,
  getLatestBriefing,
} from "@/lib/data";
import { spreadGenericCovers } from "@/lib/article-cover";

function dedupeBySlug<T extends { slug: string }>(items: T[], exclude: Set<string>, limit: number): T[] {
  const out: T[] = [];
  for (const item of items) {
    if (exclude.has(item.slug)) continue;
    out.push(item);
    exclude.add(item.slug);
    if (out.length >= limit) break;
  }
  return out;
}

export async function getHomepageData() {
  const [
    alerts,
    feed,
    actors,
    cves,
    ransomware,
    countries,
    industries,
    incidents,
    stats,
    briefing,
    scams,
  ] = await Promise.all([
    getLatestAlerts(10),
    getArticles({ limit: 32, sortBy: "publishedAt" }),
    getActors(),
    getCVEs(),
    getRansomwareGroups(),
    getCountries(),
    getIndustries(),
    getMapIncidents(),
    getPlatformStats(),
    getLatestBriefing(),
    getScamArticles({ limit: 12 }),
  ]);

  const used = new Set<string>();

  const lead =
    feed.items.find((a) => a.severity === "CRITICAL") ?? feed.items[0] ?? null;
  if (lead) used.add(lead.slug);

  // Freshest stories sit beside the hero
  const focusPicks = dedupeBySlug(feed.items, used, 4);

  const threatPicks = dedupeBySlug(
    feed.items.slice().sort((a, b) => b.intelligenceScore - a.intelligenceScore),
    used,
    4,
  );

  // Everything with a picture, in on-screen order, so stock covers don't repeat
  const withCovers = spreadGenericCovers([...(lead ? [lead] : []), ...focusPicks, ...threatPicks]);
  const offset = lead ? 1 : 0;
  const investigation = lead ? withCovers[0] : null;
  const inFocus = withCovers.slice(offset, offset + focusPicks.length);
  const topThreatCards = withCovers.slice(offset + focusPicks.length);

  const latestReports = dedupeBySlug(feed.items, used, 8);

  const scamStrip = dedupeBySlug(
    scams.items.filter((a) => a.category === "SCAMS"),
    used,
    4,
  );

  const trending = feed.items
    .slice()
    .sort((a, b) => b.intelligenceScore - a.intelligenceScore)
    .slice(0, 6)
    .map(({ slug, title, titleRu, intelligenceScore, severity }) => ({
      slug,
      title,
      titleRu,
      intelligenceScore,
      severity,
    }));

  return {
    alerts,
    articles: feed.items,
    latestReports,
    topThreats: topThreatCards,
    investigation,
    inFocus,
    trending,
    actors: actors.slice(0, 6),
    cves: cves.slice(0, 5),
    ransomware: ransomware.slice(0, 5),
    countries: countries.slice(0, 6),
    industries: industries.slice(0, 6),
    incidents: incidents.slice(0, 30),
    stats,
    briefing,
    scams: scamStrip,
  };
}
