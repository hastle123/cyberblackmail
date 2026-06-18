import {
  getLatestAlerts,
  getArticles,
  getActors,
  getCVEs,
  getRansomwareGroups,
  getCountries,
  getIndustries,
  getMapIncidents,
  getPlatformStats,
  getLatestBriefing,
} from "@/lib/data";

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
  ] = await Promise.all([
    getLatestAlerts(10),
    getArticles({ limit: 24 }),
    getActors(),
    getCVEs(),
    getRansomwareGroups(),
    getCountries(),
    getIndustries(),
    getMapIncidents(),
    getPlatformStats(),
    getLatestBriefing(),
  ]);

  const topThreats = feed.items
    .slice()
    .sort((a, b) => b.intelligenceScore - a.intelligenceScore)
    .slice(0, 4);

  const investigation =
    feed.items.find((a) => a.severity === "CRITICAL") ?? feed.items[0] ?? null;

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
    topThreats,
    investigation,
    trending,
    actors: actors.slice(0, 6),
    cves: cves.slice(0, 5),
    ransomware: ransomware.slice(0, 5),
    countries: countries.slice(0, 6),
    industries: industries.slice(0, 6),
    incidents: incidents.slice(0, 8),
    stats,
    briefing,
  };
}
