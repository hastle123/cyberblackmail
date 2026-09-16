import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { getScamCoverForSlug } from "../src/lib/article-cover";
import { SCAM_ARTICLES_RU } from "./scam-articles-ru";

const prisma = new PrismaClient();

const SCAM_ARTICLES = [
  {
    slug: "wallapop-fraud-ring-arrested-spain",
    title: "Spanish Police Arrest Wallapop Fraud Ring After €2M Marketplace Scam",
    excerpt:
      "Authorities detained 14 suspects linked to fake payment screenshots and triangulation fraud targeting Wallapop sellers across Madrid and Barcelona.",
    content:
      "Spanish National Police dismantled a Wallapop fraud ring that stole an estimated €2 million from resale platform users. Investigators said the group used forged bank transfer confirmations to convince sellers to ship high-value electronics before payments cleared. Europol supported the operation, which also uncovered links to stolen payment cards used in triangulation schemes. Victims were contacted through Wallapop chat and redirected to phishing pages mimicking the platform's secure payment flow.",
    severity: "HIGH" as const,
    source: "CyberBlackmail Intel",
    publishedAt: new Date("2026-06-10"),
  },
  {
    slug: "vinted-verification-code-scam-wave-uk",
    title: "UK Warning: Vinted Verification Code Scam Targets Sellers Nationwide",
    excerpt:
      "Action Fraud reports a surge in Vinted account takeovers after buyers trick sellers into sharing SMS verification codes.",
    content:
      "UK fraud authorities warned of a growing Vinted scam method in which fake buyers request verification codes under the pretense of confirming identity or releasing escrow funds. Once sellers share the code, attackers hijack accounts, change payout details, and list stolen goods. The technique exploits users unfamiliar with two-factor authentication flows. CyberBlackmail analysts recommend never sharing codes and completing all transactions inside the official Vinted app.",
    severity: "HIGH" as const,
    source: "CyberBlackmail Intel",
    publishedAt: new Date("2026-06-08"),
  },
  {
    slug: "poshmark-triangulation-fraud-indictment-us",
    title: "US Indictment Details Poshmark Triangulation Fraud Network",
    excerpt:
      "Federal prosecutors charged five defendants with using stolen credit cards and Poshmark listings to launder merchandise.",
    content:
      "A federal indictment unsealed in California describes a triangulation fraud network that operated across Poshmark and eBay. Suspects allegedly purchased items with stolen cards from legitimate retailers, relisted them on Poshmark at a discount, and collected buyer payments while victims received chargebacks. Prosecutors said the scheme mixed romance scam recruitment with resale fraud coaching on Telegram. If convicted, defendants face wire fraud and identity theft charges.",
    severity: "CRITICAL" as const,
    source: "CyberBlackmail Intel",
    publishedAt: new Date("2026-06-05"),
  },
  {
    slug: "kleinanzeigen-phishing-campaign-germany",
    title: "Kleinanzeigen Phishing Campaign Spoofs PayPal and DHL Checkout Pages",
    excerpt:
      "German buyers and sellers report fake Kleinanzeigen payment links that harvest credentials and card numbers.",
    content:
      "Security researchers identified a Kleinanzeigen-focused phishing campaign distributing links that mimic PayPal invoice pages and DHL parcel fee portals. Victims—often car and electronics sellers—receive messages claiming a buyer has paid but additional shipping insurance is required. The phishing kit rotates domains weekly to evade blocklists. BSI recommends verifying payments only inside Kleinanzeigen and never following links sent via external chat apps.",
    severity: "HIGH" as const,
    source: "CyberBlackmail Intel",
    publishedAt: new Date("2026-06-03"),
  },
  {
    slug: "depop-refund-scam-method-explained",
    title: "How the Depop Refund Scam Works: Overpayment and Fake Bank Alerts",
    excerpt:
      "Analysts break down the refund scam method hitting Depop and Poshmark sellers in the US and UK.",
    content:
      "The Depop refund scam begins when a buyer claims to have accidentally overpaid via bank transfer and sends a manipulated screenshot as proof. The seller is pressured to return the difference via Zelle, Venmo, or crypto before the original transfer bounces or is revealed as fake. Variants include fake 'buyer protection' emails and counterfeit Depop support chats. Sellers should verify funds in their actual bank or Depop balance—not images sent in chat.",
    severity: "MEDIUM" as const,
    source: "CyberBlackmail Intel",
    publishedAt: new Date("2026-05-28"),
  },
  {
    slug: "facebook-marketplace-arrests-houston",
    title: "Houston Police Arrest Trio Running Facebook Marketplace Rental Scam",
    excerpt:
      "Suspects collected deposits for properties they did not own using cloned Facebook Marketplace listings.",
    content:
      "Houston Police arrested three individuals accused of advertising fake rental properties on Facebook Marketplace. Victims paid deposits and application fees through Cash App and Zelle after touring properties made available through identity theft or vacant homes. Investigators linked the group to similar reports in Dallas and Austin. The case highlights advance-fee fraud migrating from classified sites to social marketplaces with built-in trust signals.",
    severity: "HIGH" as const,
    source: "CyberBlackmail Intel",
    publishedAt: new Date("2026-05-22"),
  },
  {
    slug: "leboncoin-fake-buyer-method-france",
    title: "Leboncoin Fake Buyer Method: Criminals Pose as Overeager Purchasers",
    excerpt:
      "French cybercrime units document a social engineering playbook used against Leboncoin and Vinted sellers.",
    content:
      "French authorities published an advisory on the 'fake buyer' method targeting Leboncoin sellers of phones and luxury goods. Scammers build urgency, refuse in-person pickup, and insist on courier collection with fraudulent shipping labels. Some variants send QR codes that authorize fraudulent SEPA debits. The method pairs with stolen account access sold on underground forums. Sellers are urged to use platform escrow and avoid off-platform messaging.",
    severity: "MEDIUM" as const,
    source: "CyberBlackmail Intel",
    publishedAt: new Date("2026-05-18"),
  },
  {
    slug: "ebay-olx-cross-border-scam-bust-europol",
    title: "Europol Busts Cross-Border eBay and OLX Fraud Network in Six Countries",
    excerpt:
      "Operation targeted advance-fee and fake escrow scams affecting eBay Kleinanzeigen and OLX users.",
    content:
      "Europol coordinated raids across Germany, Poland, Romania, Spain, Italy, and the Netherlands against a cross-border scam network. Suspects operated fake escrow websites advertised to eBay and OLX users, collecting advance fees for vehicles and electronics that did not exist. Over 200 victims were identified in preliminary accounting. The bust also seized phishing kits tailored to Kleinanzeigen and Subito branding.",
    severity: "CRITICAL" as const,
    source: "CyberBlackmail Intel",
    publishedAt: new Date("2026-05-12"),
  },
  {
    slug: "coinbase-support-phishing-drain-millions",
    title: "Coinbase Users Hit by Fake Support Phishing — $4M Drained in One Week",
    excerpt:
      "Fraudsters impersonating Coinbase support via phone and SMS trick victims into sharing login codes and approving wallet transfers.",
    content:
      "A coordinated Coinbase phishing campaign drained an estimated $4 million from US victims in seven days. Scammers called users claiming suspicious activity, directed them to fake coinbase-security.com pages, and harvested 2FA codes. Some victims were coached to transfer crypto to a 'safe wallet' controlled by criminals. Coinbase warned customers that support never calls unsolicited and will never ask for seed phrases or remote screen access.",
    severity: "CRITICAL" as const,
    source: "CyberBlackmail Intel",
    publishedAt: new Date("2026-06-14"),
  },
  {
    slug: "binance-pig-butchering-ring-dismantled-singapore",
    title: "Singapore Police Dismantle Pig Butchering Ring Targeting Binance Users",
    excerpt:
      "Twenty-two suspects arrested for romance-investment scams that laundered funds through Binance and OTC crypto desks.",
    content:
      "Singapore authorities arrested 22 people linked to a pig butchering syndicate that targeted victims across Southeast Asia. Criminals built relationships on dating apps, then pushed fake trading dashboards showing fabricated Binance-linked profits. Withdrawals required additional 'tax' payments. Investigators seized phones, laptops, and ledgers showing $12M in victim flows through mule accounts and Binance P2P channels.",
    severity: "CRITICAL" as const,
    source: "CyberBlackmail Intel",
    publishedAt: new Date("2026-06-12"),
  },
  {
    slug: "metamask-wallet-drainer-chrome-extension",
    title: "MetaMask Drainer Hidden in Fake Chrome Extension — 3,000 Wallets Emptied",
    excerpt:
      "Security researchers expose a malicious browser extension that mimicked MetaMask and stole seed phrases and session keys.",
    content:
      "A fake MetaMask Chrome extension with 12,000 downloads contained a wallet drainer that intercepted transaction signing requests. Victims who imported seed phrases lost ETH and ERC-20 tokens within minutes. The drainer used approval phishing for NFTs and leveraged Permit2 signatures to bypass standard warnings. Users are urged to install wallets only from official stores and verify extension publisher IDs.",
    severity: "HIGH" as const,
    source: "CyberBlackmail Intel",
    publishedAt: new Date("2026-06-11"),
  },
  {
    slug: "zelle-venmo-mule-recruitment-telegram",
    title: "Telegram Channels Recruit Zelle and Venmo Mules for Marketplace Fraud",
    excerpt:
      "FBI warns of 'money mule' job ads on Telegram paying victims to receive and forward stolen marketplace payments.",
    content:
      "The FBI issued an alert on Telegram groups recruiting money mules for Wallapop, Facebook Marketplace, and Poshmark fraud rings. Participants are told they will receive customer payments and forward a portion via Zelle or Venmo, keeping a commission. In reality they launder proceeds from triangulation and fake buyer scams. Mules face criminal charges even when unaware of the underlying fraud.",
    severity: "HIGH" as const,
    source: "CyberBlackmail Intel",
    publishedAt: new Date("2026-06-09"),
  },
];

async function main() {
  console.log("Seeding scam articles…");

  for (const def of SCAM_ARTICLES) {
    const ru = SCAM_ARTICLES_RU[def.slug];
    await prisma.article.upsert({
      where: { slug: def.slug },
      create: {
        ...def,
        titleRu: ru?.titleRu ?? null,
        excerptRu: ru?.excerptRu ?? null,
        contentRu: ru?.contentRu ?? null,
        coverImage: getScamCoverForSlug(def.slug),
        category: "SCAMS",
        intelligenceScore: def.severity === "CRITICAL" ? 82 : def.severity === "HIGH" ? 70 : 55,
        readTime: 5,
      },
      update: {
        title: def.title,
        excerpt: def.excerpt,
        content: def.content,
        titleRu: ru?.titleRu ?? null,
        excerptRu: ru?.excerptRu ?? null,
        contentRu: ru?.contentRu ?? null,
        coverImage: getScamCoverForSlug(def.slug),
        category: "SCAMS",
        severity: def.severity,
        intelligenceScore: def.severity === "CRITICAL" ? 82 : def.severity === "HIGH" ? 70 : 55,
        source: def.source,
        publishedAt: def.publishedAt,
      },
    });
    console.log(`  ✓ ${def.slug}`);
  }

  console.log(`Done — ${SCAM_ARTICLES.length} scam articles ready.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
