const PLACEHOLDER_PATTERNS = [
  /^russian headline$/i,
  /^russian 1-2 sentence summary$/i,
  /^российский заголовок$/i,
  /^русский заголовок$/i,
  /^краткое описание на русском$/i,
];

export const ALLOWED_LATIN = new Set([
  "apple", "google", "meta", "wifi", "bluetooth", "github", "youtube", "iphone",
  "android", "crypto", "mfa", "api", "sql", "vpn", "dns", "http", "https", "usb",
  "pdf", "json", "html", "rss", "ceo", "cfo", "nft", "defi", "telegram", "whatsapp",
  "coinbase", "binance", "paypal", "venmo", "zelle", "chrome", "firefox", "windows",
  "linux", "macos", "ios", "cve", "mfa", "otp", "sms", "email", "online", "offline",
  "aws", "azure", "oauth", "salesforce", "fortinet", "splunk", "cisa", "fbi", "mitre",
  "apt", "dll", "vpn", "tor", "nft", "defi", "web3", "dapp", "nft", "gpu", "cpu",
  "depop", "vinted", "poshmark", "wallapop", "kleinanzeigen", "leboncoin", "marktplaats",
  "gumtree", "mercari", "subito", "craigslist", "offerup", "avito", "stockx", "grailed",
  "temu", "revolut", "wise", "chase", "barclays", "booking", "airbnb", "klue", "huntress",
  "splunk", "fortinet", "cisa", "ollama", "depop", "mfa", "edr", "pos", "ot", "llm", "ai",
  "wordpress", "plugin", "plugins", "recaptcha", "microsoft", "apple", "mastodon", "telegram",
  "accenture", "dragos", "blackfog", "macos", "endpoint", "endpoints", "ransomware", "malware",
  "phishing", "exploit", "exploits", "breach", "breaches", "botnet", "socgholish", "fortibleed",
  "smtp", "gravity", "cve", "rce", "defiant", "icarus", "evil", "corp", "runzero", "netrise",
  "edr", "etherrat", "healthcare", "schneider", "easergy", "ecostruxure", "powerlogic", "saitel",
  "broker", "phi", "s3", "amazon", "prinz", "eugen", "mastra", "threatdown", "malwarebytes",
  "gentlemen", "rokarolla", "etherrat", "lockbit", "akira", "socgholish", "roblox", "github",
  "server", "edge", "zero", "day", "recycle", "bin",
]);

/** Common English words that should never appear in RU titles/excerpts (excluding brands in ALLOWED_LATIN). */
const ENGLISH_LEAK_WORDS = new Set(
  "recently recent prioritizes prioritize modified encryption hackers attack security breach vulnerability exploit phishing discovered found named leaves files system operation investigation custom retail spread spreads patches shortcuts backdoor credentials stolen supply chain target targets engineers developers losing games fake offer campaign voice vishing infrastructure delivering pages enforcement servers cleaned gaming fans abused stealing affiliates hospital network provider reused deploys against market lists million products week edition monitoring securing digital keys unlocks working grants full control posting depicting famous women taken feds hacked infect cleans nearly tied inside malicious major entire attacks worm via prioritizes the and with from that this are was have has been their into over after before under through during without within along across behind beyond despite except toward towards upon where when while which who whom whose what why how all any both each few more most other some such only own same so than too very can will just should now for new uses use using used hit hits fix fixes fixed patch patched update updated break breaks broken clean cleaned list listed run runs running group groups job jobs steal steals strip strips raid raids plugin plugins flow flows infected help helps find finds bring brings route routes traffic adversary flaw flaws actively exploited record breaking top product award tests test third party other earn earns shadow visibility endpoints endpoint vision developer developers vulnerabilities vulnerability apis helping called delivers deliver delivered"
    .split(/\s+/),
);

export function hasEnglishLeakInRussian(text: string): boolean {
  const words = text.match(/\b[A-Za-z][A-Za-z'-]*/g) ?? [];
  return words.some((w) => {
    const lower = w.toLowerCase().replace(/['']/g, "");
    if (ALLOWED_LATIN.has(lower)) return false;
    if (/^cve-\d/i.test(w)) return false;
    if (w.length <= 2) return false;
    return ENGLISH_LEAK_WORDS.has(lower);
  });
}

export function hasGarbageMixedScript(text: string): boolean {
  const t = text.trim();
  if (!t) return true;
  if (/[а-яё]{2,}[a-z]{2,}|[a-z]{2,}[а-яё]{2,}/i.test(t)) return true;
  if (/désactiv|ruя|custom-|POS-|saas-|Softr|разбeg|Эдиш|вklean|сdeep|Beatsooks|Telecom_provider|Positions|малвар|Пoland|Investигация|rửa|меньжеств|на purpose|[\u0E00-\u0E7F\u0100-\u024F]/i.test(t)) return true;
  if (cyrillicLetterRatio(t) < 0.42 && t.length > 25 && suspiciousEnglishWords(t) > 2) return true;
  return false;
}

export function isRuTitleAcceptable(en: string, ru: string): boolean {
  const t = ru.trim();
  if (!t || t.length < 8) return false;
  if (hasEnglishLeakInRussian(t)) return false;
  if (hasGarbageMixedScript(t)) return false;
  return isArticleTranslated({ title: en, titleRu: t });
}

export function isPlaceholderRussian(text: string): boolean {
  const t = text.trim();
  if (!t) return true;
  return PLACEHOLDER_PATTERNS.some((re) => re.test(t));
}

export function suspiciousEnglishWords(text: string): number {
  const words = text.match(/\b[A-Za-z][A-Za-z'\-]*/g) ?? [];
  return words.filter((w) => {
    const lower = w.toLowerCase().replace(/['']/g, "");
    if (ALLOWED_LATIN.has(lower)) return false;
    if (/^cve-\d/i.test(w)) return false;
    if (w.length <= 2) return false;
    return true;
  }).length;
}

/** Cyrillic glued to Latin in the same token (e.g. «дляsomeone»). */
export function hasDisallowedLatin(text: string): boolean {
  return /[а-яёА-ЯЁ][a-zA-Z]|[a-zA-Z][а-яёА-ЯЁ]/.test(text);
}

export function cyrillicLetterRatio(text: string): number {
  const letters = text.replace(/[^\p{L}]/gu, "");
  if (!letters.length) return 0;
  const cyrillic = letters.replace(/[^\u0400-\u04FF]/gu, "");
  return cyrillic.length / letters.length;
}

export function isQualityRussianText(text: string, minRatio = 0.55): boolean {
  const t = text.trim();
  if (t.length < 20) {
    if (isPlaceholderRussian(t)) return false;
    if (hasDisallowedLatin(t)) return false;
    return cyrillicLetterRatio(t) >= 0.28;
  }

  const words = t.split(/\s+/).filter(Boolean).length || 1;
  const englishLeak = suspiciousEnglishWords(t) / words;
  const leakMax = t.length < 160 ? 0.24 : t.length < 500 ? 0.14 : 0.28;
  if (englishLeak > leakMax) return false;
  if (t.length < 500 && hasDisallowedLatin(t)) return false;

  const ratioMin = t.length < 160 ? Math.min(minRatio, 0.38) : minRatio;
  return cyrillicLetterRatio(t) >= ratioMin;
}

export function isArticleTranslated(article: {
  title: string;
  titleRu?: string | null;
}): boolean {
  if (!article.titleRu?.trim()) return false;
  const ru = article.titleRu.trim();
  if (ru === article.title.trim()) return false;
  if (isPlaceholderRussian(ru)) return false;
  if (hasEnglishLeakInRussian(ru)) return false;
  if (cyrillicLetterRatio(ru) < 0.2) return false;
  const words = ru.split(/\s+/).filter(Boolean).length || 1;
  if (suspiciousEnglishWords(ru) / words > 0.35) return false;
  return true;
}

export function hasQualityRussianBody(contentRu?: string | null): boolean {
  if (!contentRu?.trim()) return false;
  const t = contentRu.trim();
  if (isPlaceholderRussian(t.slice(0, 80))) return false;
  if (hasGarbageMixedScript(t)) return false;
  if (t.includes("…") && t.length < 900) return false;
  const words = t.split(/\s+/).filter(Boolean).length || 1;
  const leakMax = t.length > 2000 ? 0.38 : 0.32;
  if (suspiciousEnglishWords(t) / words > leakMax) return false;
  return cyrillicLetterRatio(t) >= 0.26;
}
