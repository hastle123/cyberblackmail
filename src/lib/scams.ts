export type ScamTopic = "arrests" | "methods";

export type ScamPlatformGroup = "crypto" | "marketplace" | "payments" | "social" | "banking" | "travel";

export type ScamPlatform = {
  slug: string;
  name: string;
  region: string;
  group: ScamPlatformGroup;
  keywords: string[];
};

export const SCAM_PLATFORM_GROUPS: ScamPlatformGroup[] = [
  "crypto",
  "marketplace",
  "payments",
  "social",
  "banking",
  "travel",
];

export const SCAM_TOPICS: { id: ScamTopic; keywords: string[] }[] = [
  {
    id: "arrests",
    keywords: [
      "arrest", "arrested", "detained", "charged", "sentenced", "indicted", "bust",
      "crackdown", "extradited", "convicted", "police", "fbi", "europol", "doj",
      "seized", "takedown", "pleaded guilty",
    ],
  },
  {
    id: "methods",
    keywords: [
      "method", "technique", "phishing", "fake payment", "fake buyer", "fake seller",
      "refund scam", "triangulation", "advance fee", "buyer protection", "verification code",
      "qr code scam", "wire transfer", "zelle scam", "paypal scam", "shipping scam",
      "overpayment", "impersonation", "pig butchering", "wallet drainer", "seed phrase",
      "sim swap", "deepfake", "mule", "rug pull", "pump and dump", "task scam",
      "crypto investment", "fake support", "romance scam",
    ],
  },
];

const EXTRA_SCAM_KEYWORDS = [
  "scam", "fraud", "fraudster", "fraud ring", "scam ring", "con artist",
  "marketplace fraud", "classified fraud", "online fraud", "internet fraud", "wire fraud",
  "investment fraud", "crypto scam", "bitcoin scam", "ethereum scam", "nft scam",
  "impersonat", "social engineering", "account takeover", "ato attack",
  "money mule", "check fraud", "bec scam", "business email compromise",
  "tech support scam", "recovery scam", "pig-butchering", "sha zhu pan",
  "drainer", "address poisoning", "approval scam", "fake exchange",
  "employment scam", "job scam", "remote work scam", "task fraud",
  "ai voice", "voice clone", "vishing", "smishing",
];

export const SCAM_PLATFORMS: ScamPlatform[] = [
  // Crypto
  { slug: "coinbase", name: "Coinbase", region: "US / Global", group: "crypto", keywords: ["coinbase"] },
  { slug: "binance", name: "Binance", region: "Global", group: "crypto", keywords: ["binance"] },
  { slug: "kraken", name: "Kraken", region: "US / EU", group: "crypto", keywords: ["kraken"] },
  { slug: "crypto-com", name: "Crypto.com", region: "Global", group: "crypto", keywords: ["crypto.com", "crypto com"] },
  { slug: "robinhood", name: "Robinhood", region: "US", group: "crypto", keywords: ["robinhood scam", "robinhood fraud"] },
  { slug: "metamask", name: "MetaMask", region: "Web3", group: "crypto", keywords: ["metamask"] },
  { slug: "trust-wallet", name: "Trust Wallet", region: "Web3", group: "crypto", keywords: ["trust wallet"] },
  { slug: "phantom", name: "Phantom", region: "Solana", group: "crypto", keywords: ["phantom wallet"] },
  { slug: "ledger", name: "Ledger", region: "Hardware", group: "crypto", keywords: ["ledger scam", "ledger phishing"] },
  { slug: "uniswap", name: "Uniswap", region: "DeFi", group: "crypto", keywords: ["uniswap scam"] },
  // Marketplaces
  { slug: "wallapop", name: "Wallapop", region: "ES / EU", group: "marketplace", keywords: ["wallapop"] },
  { slug: "vinted", name: "Vinted", region: "EU / UK", group: "marketplace", keywords: ["vinted"] },
  { slug: "poshmark", name: "Poshmark", region: "US", group: "marketplace", keywords: ["poshmark"] },
  { slug: "kleinanzeigen", name: "Kleinanzeigen", region: "DE", group: "marketplace", keywords: ["kleinanzeigen", "ebay kleinanzeigen"] },
  { slug: "depop", name: "Depop", region: "US / UK", group: "marketplace", keywords: ["depop"] },
  { slug: "facebook-marketplace", name: "Facebook Marketplace", region: "Global", group: "marketplace", keywords: ["facebook marketplace", "fb marketplace"] },
  { slug: "ebay", name: "eBay", region: "Global", group: "marketplace", keywords: ["ebay scam", "ebay fraud"] },
  { slug: "etsy", name: "Etsy", region: "Global", group: "marketplace", keywords: ["etsy scam", "etsy fraud"] },
  { slug: "mercari", name: "Mercari", region: "US / JP", group: "marketplace", keywords: ["mercari"] },
  { slug: "leboncoin", name: "Leboncoin", region: "FR", group: "marketplace", keywords: ["leboncoin"] },
  { slug: "marktplaats", name: "Marktplaats", region: "NL", group: "marketplace", keywords: ["marktplaats"] },
  { slug: "gumtree", name: "Gumtree", region: "UK / AU", group: "marketplace", keywords: ["gumtree"] },
  { slug: "olx", name: "OLX", region: "EU / LATAM", group: "marketplace", keywords: ["olx scam", "olx fraud"] },
  { slug: "subito", name: "Subito", region: "IT", group: "marketplace", keywords: ["subito.it", "subito"] },
  { slug: "craigslist", name: "Craigslist", region: "US", group: "marketplace", keywords: ["craigslist scam"] },
  { slug: "offerup", name: "OfferUp", region: "US", group: "marketplace", keywords: ["offerup"] },
  { slug: "avito", name: "Avito", region: "RU", group: "marketplace", keywords: ["avito scam", "avito fraud"] },
  { slug: "stockx", name: "StockX", region: "US", group: "marketplace", keywords: ["stockx scam"] },
  { slug: "grailed", name: "Grailed", region: "US", group: "marketplace", keywords: ["grailed scam"] },
  { slug: "temu", name: "Temu", region: "Global", group: "marketplace", keywords: ["temu scam"] },
  // Payments
  { slug: "paypal", name: "PayPal", region: "Global", group: "payments", keywords: ["paypal scam", "paypal fraud"] },
  { slug: "venmo", name: "Venmo", region: "US", group: "payments", keywords: ["venmo scam"] },
  { slug: "zelle", name: "Zelle", region: "US", group: "payments", keywords: ["zelle scam", "zelle fraud"] },
  { slug: "cash-app", name: "Cash App", region: "US", group: "payments", keywords: ["cash app scam"] },
  { slug: "revolut", name: "Revolut", region: "EU / UK", group: "payments", keywords: ["revolut scam"] },
  { slug: "wise", name: "Wise", region: "Global", group: "payments", keywords: ["wise scam", "transferwise"] },
  { slug: "western-union", name: "Western Union", region: "Global", group: "payments", keywords: ["western union scam"] },
  // Social / messaging
  { slug: "telegram", name: "Telegram", region: "Global", group: "social", keywords: ["telegram scam"] },
  { slug: "whatsapp", name: "WhatsApp", region: "Global", group: "social", keywords: ["whatsapp scam"] },
  { slug: "instagram", name: "Instagram", region: "Global", group: "social", keywords: ["instagram scam"] },
  { slug: "tinder", name: "Tinder", region: "Global", group: "social", keywords: ["tinder scam", "dating scam"] },
  { slug: "linkedin", name: "LinkedIn", region: "Global", group: "social", keywords: ["linkedin scam", "job scam"] },
  // Banking
  { slug: "bank-impersonation", name: "Bank Impersonation", region: "Global", group: "banking", keywords: ["bank impersonation", "fake bank", "banking scam"] },
  { slug: "chase", name: "Chase", region: "US", group: "banking", keywords: ["chase scam", "chase fraud"] },
  { slug: "barclays", name: "Barclays", region: "UK", group: "banking", keywords: ["barclays scam"] },
  // Travel
  { slug: "booking-com", name: "Booking.com", region: "Global", group: "travel", keywords: ["booking.com scam", "booking scam"] },
  { slug: "airbnb", name: "Airbnb", region: "Global", group: "travel", keywords: ["airbnb scam"] },
];

export const SCAM_METHODS = [
  { id: "fake-payment", icon: "💳" },
  { id: "verification-code", icon: "📱" },
  { id: "triangulation", icon: "📦" },
  { id: "refund-scam", icon: "↩️" },
  { id: "phishing-link", icon: "🔗" },
  { id: "advance-fee", icon: "💰" },
  { id: "pig-butchering", icon: "🐷" },
  { id: "crypto-drain", icon: "🪙" },
  { id: "fake-support", icon: "🎧" },
  { id: "romance-scam", icon: "💔" },
  { id: "job-task-scam", icon: "💼" },
  { id: "sim-swap", icon: "📶" },
  { id: "seed-phrase", icon: "🔑" },
  { id: "deepfake-voice", icon: "🎙️" },
  { id: "investment-fraud", icon: "📈" },
  { id: "mule-recruitment", icon: "🏦" },
] as const;

export function getPlatformBySlug(slug: string): ScamPlatform | undefined {
  return SCAM_PLATFORMS.find((p) => p.slug === slug);
}

export function getPlatformsByGroup(group: ScamPlatformGroup): ScamPlatform[] {
  return SCAM_PLATFORMS.filter((p) => p.group === group);
}

export function isValidScamTopic(value: string): value is ScamTopic {
  return value === "arrests" || value === "methods";
}

export function isValidScamGroup(value: string): value is ScamPlatformGroup {
  return SCAM_PLATFORM_GROUPS.includes(value as ScamPlatformGroup);
}

export function getAllScamKeywords(): string[] {
  const fromPlatforms = SCAM_PLATFORMS.flatMap((p) => p.keywords);
  const fromTopics = SCAM_TOPICS.flatMap((t) => t.keywords);
  return [...new Set([...fromPlatforms, ...fromTopics, ...EXTRA_SCAM_KEYWORDS])];
}

const EDUCATIONAL_OR_MEDIA =
  /\b(webinar|podcast|lock and code|re-?air|s\d+e\d+|listen to|tune in|episode|roundup|newsletter)\b/i;

const STRONG_SCAM_STORY =
  /\b(scam ring|fraud ring|charged|arrested|indicted|defrauded|stole \$|million stolen|\$\d+\s*million|fake (payment|buyer|seller|bank|support)|pig butcher|money mule|triangulation|advance fee|wallet drainer|romance scam|zelle scam|marketplace fraud|wire fraud)\b/i;

export function matchesScamContent(text: string): boolean {
  const lower = text.toLowerCase();
  return getAllScamKeywords().some((k) => lower.includes(k));
}

const MALWARE_FOCUS =
  /\b(ransomware|malware|trojan|backdoor|botnet|zero-?day|cve-\d|apt\d|exploit kit|nation.state|evil corp|lockbit|blackcat|wiper|rootkit|socgholish|emotet|trickbot)\b/i;
const SCAM_SIGNAL =
  /\b(scam|fraud|phish|impersonat|pig butcher|money mule|refund scam|fake (payment|buyer|seller|bank)|wire fraud|romance scam|investment fraud|crypto scam|marketplace fraud|con artist|advance fee)\b/i;

/** True when article is about scams/fraud, not generic malware news mis-tagged as SCAMS. */
export function isScamArticleContent(title: string, excerpt = ""): boolean {
  const text = `${title} ${excerpt}`;
  const lower = text.toLowerCase();
  if (!matchesScamContent(text)) return false;

  if (EDUCATIONAL_OR_MEDIA.test(text) && !STRONG_SCAM_STORY.test(text)) return false;

  if (MALWARE_FOCUS.test(text) && !SCAM_SIGNAL.test(text)) return false;

  if (/\bdeepfake\b/i.test(text) && !STRONG_SCAM_STORY.test(text) && !/\b(scam|fraud|sextortion|blackmail)\b/i.test(text)) {
    return false;
  }

  const platformHit = SCAM_PLATFORMS.some((p) => p.keywords.some((k) => lower.includes(k)));
  if (!platformHit && !SCAM_SIGNAL.test(text) && !STRONG_SCAM_STORY.test(text)) return false;

  return true;
}
