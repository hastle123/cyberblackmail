type GeoPoint = {
  lat: number;
  lng: number;
  country: string;
  city: string;
  countryCode: string;
};

const FALLBACK_COORDS: GeoPoint[] = [
  { lat: 38.9072, lng: -77.0369, country: "US", city: "Washington DC", countryCode: "US" },
  { lat: 51.5074, lng: -0.1278, country: "GB", city: "London", countryCode: "GB" },
  { lat: 52.52, lng: 13.405, country: "DE", city: "Berlin", countryCode: "DE" },
  { lat: 50.4501, lng: 30.5234, country: "UA", city: "Kyiv", countryCode: "UA" },
  { lat: 48.8566, lng: 2.3522, country: "FR", city: "Paris", countryCode: "FR" },
  { lat: 40.7128, lng: -74.006, country: "US", city: "New York", countryCode: "US" },
  { lat: 35.6762, lng: 139.6503, country: "JP", city: "Tokyo", countryCode: "JP" },
  { lat: 1.3521, lng: 103.8198, country: "SG", city: "Singapore", countryCode: "SG" },
  { lat: 28.6139, lng: 77.209, country: "IN", city: "New Delhi", countryCode: "IN" },
  { lat: -33.8688, lng: 151.2093, country: "AU", city: "Sydney", countryCode: "AU" },
];

const COUNTRY_HINTS: { pattern: RegExp; point: GeoPoint }[] = [
  { pattern: /\b(india|indian|delhi|mumbai)\b/i, point: { lat: 28.6139, lng: 77.209, country: "IN", city: "New Delhi", countryCode: "IN" } },
  { pattern: /\b(united states|u\.s\.|usa|american|washington dc|new york|california|texas|fortinet|microsoft|google)\b/i, point: { lat: 38.9072, lng: -77.0369, country: "US", city: "Washington DC", countryCode: "US" } },
  { pattern: /\b(united kingdom|britain|british|london|uk\b)\b/i, point: { lat: 51.5074, lng: -0.1278, country: "GB", city: "London", countryCode: "GB" } },
  { pattern: /\b(germany|german|berlin)\b/i, point: { lat: 52.52, lng: 13.405, country: "DE", city: "Berlin", countryCode: "DE" } },
  { pattern: /\b(france|french|paris)\b/i, point: { lat: 48.8566, lng: 2.3522, country: "FR", city: "Paris", countryCode: "FR" } },
  { pattern: /\b(ukraine|ukrainian|kyiv|kiev)\b/i, point: { lat: 50.4501, lng: 30.5234, country: "UA", city: "Kyiv", countryCode: "UA" } },
  { pattern: /\b(russia|russian|moscow)\b/i, point: { lat: 55.7558, lng: 37.6173, country: "RU", city: "Moscow", countryCode: "RU" } },
  { pattern: /\b(china|chinese|beijing)\b/i, point: { lat: 39.9042, lng: 116.4074, country: "CN", city: "Beijing", countryCode: "CN" } },
  { pattern: /\b(israel|israeli|tel aviv)\b/i, point: { lat: 32.0853, lng: 34.7818, country: "IL", city: "Tel Aviv", countryCode: "IL" } },
  { pattern: /\b(iran|iranian|tehran)\b/i, point: { lat: 35.6892, lng: 51.389, country: "IR", city: "Tehran", countryCode: "IR" } },
  { pattern: /\b(japan|japanese|tokyo)\b/i, point: { lat: 35.6762, lng: 139.6503, country: "JP", city: "Tokyo", countryCode: "JP" } },
  { pattern: /\b(canada|canadian|toronto|ottawa)\b/i, point: { lat: 43.6532, lng: -79.3832, country: "CA", city: "Toronto", countryCode: "CA" } },
  { pattern: /\b(australia|australian|sydney)\b/i, point: { lat: -33.8688, lng: 151.2093, country: "AU", city: "Sydney", countryCode: "AU" } },
  { pattern: /\b(brazil|brazilian|são paulo|sao paulo)\b/i, point: { lat: -23.5505, lng: -46.6333, country: "BR", city: "São Paulo", countryCode: "BR" } },
  { pattern: /\b(netherlands|dutch|amsterdam)\b/i, point: { lat: 52.3676, lng: 4.9041, country: "NL", city: "Amsterdam", countryCode: "NL" } },
  { pattern: /\b(nintendo|telegram)\b/i, point: { lat: 28.6139, lng: 77.209, country: "IN", city: "New Delhi", countryCode: "IN" } },
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function geolocateIncident(text: string, slug: string): GeoPoint {
  for (const hint of COUNTRY_HINTS) {
    if (hint.pattern.test(text)) return hint.point;
  }
  return FALLBACK_COORDS[hashString(slug) % FALLBACK_COORDS.length];
}

export function incidentTypeFromCategory(category: string): string {
  switch (category) {
    case "RANSOMWARE":
      return "Ransomware";
    case "BREAKING_BREACH":
    case "DATA_LEAK":
      return "Data Breach";
    case "APT":
      return "APT Activity";
    case "ZERO_DAY":
      return "Zero-Day";
    case "DARKNET":
      return "Darknet";
    default:
      return "Cyber Incident";
  }
}
