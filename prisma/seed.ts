import { config } from "dotenv";
config();

import {
  PrismaClient,
  Severity,
  IOCType,
  TimelineStage,
  Category,
  ActorType,
  GroupStatus,
  ExploitStatus,
  UserRole,
} from "@prisma/client";
import { hash } from "bcryptjs";
import {
  ARTICLE_RU,
  ALERT_MESSAGES_RU,
  buildArticleContentRu,
  buildImpactRu,
  CATEGORY_RU,
  MITIGATIONS_RU,
  SEVERITY_RU,
} from "./article-ru";
import { seedForum } from "./forum-seed";

const prisma = new PrismaClient();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "ChangeMe123!";

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

const dateOnly = (n: number) => {
  const d = daysAgo(n);
  d.setHours(0, 0, 0, 0);
  return d;
};

async function clearDatabase() {
  await prisma.auditLog.deleteMany();
  await prisma.iOCOnArticle.deleteMany();
  await prisma.iOCOnIncident.deleteMany();
  await prisma.threatActorOnArticle.deleteMany();
  await prisma.companyOnArticle.deleteMany();
  await prisma.cVEOnArticle.deleteMany();
  await prisma.cVEOnActor.deleteMany();
  await prisma.threatActorOnCountry.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.threatTimelineEvent.deleteMany();
  await prisma.threatAnalysis.deleteMany();
  await prisma.breach.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.iOC.deleteMany();
  await prisma.article.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.ransomwareGroup.deleteMany();
  await prisma.cVE.deleteMany();
  await prisma.threatActor.deleteMany();
  await prisma.company.deleteMany();
  await prisma.country.deleteMany();
  await prisma.industry.deleteMany();
  await prisma.dailyBriefing.deleteMany();
  await prisma.source.deleteMany();
  await prisma.user.deleteMany();
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function pick<T>(arr: T[], index: number): T {
  return arr[index % arr.length];
}

function buildIocs(count: number) {
  const iocs: {
    type: IOCType;
    value: string;
    threatLevel: Severity;
    intelligenceScore: number;
    firstSeen: Date;
    lastSeen: Date;
  }[] = [];

  const severities: Severity[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

  for (let i = 0; i < count; i++) {
    const typeIndex = i % 5;
    const severity = pick(severities, i);
    const firstSeen = daysAgo(90 - (i % 60));
    const lastSeen = daysAgo(i % 14);

    switch (typeIndex) {
      case 0:
        iocs.push({
          type: "IP",
          value: `185.${(i % 200) + 10}.${(i * 7) % 255}.${(i * 13) % 255}`,
          threatLevel: severity,
          intelligenceScore: 40 + (i % 60),
          firstSeen,
          lastSeen,
        });
        break;
      case 1:
        iocs.push({
          type: "DOMAIN",
          value: `malware-c2-${i}.evil-host.net`,
          threatLevel: severity,
          intelligenceScore: 35 + (i % 65),
          firstSeen,
          lastSeen,
        });
        break;
      case 2:
        iocs.push({
          type: "URL",
          value: `https://phish-${i}.credential-stealer.io/login/verify`,
          threatLevel: severity,
          intelligenceScore: 30 + (i % 70),
          firstSeen,
          lastSeen,
        });
        break;
      case 3:
        iocs.push({
          type: "HASH",
          value: `${"a".repeat(32)}${i.toString(16).padStart(32, "0")}`.slice(0, 64),
          threatLevel: severity,
          intelligenceScore: 45 + (i % 55),
          firstSeen,
          lastSeen,
        });
        break;
      default:
        iocs.push({
          type: "EMAIL",
          value: `threat-actor-${i}@dropmail-c2.org`,
          threatLevel: severity,
          intelligenceScore: 25 + (i % 75),
          firstSeen,
          lastSeen,
        });
    }
  }

  return iocs;
}

function buildCves(count: number) {
  const vendors = [
    ["Microsoft", "Windows"],
    ["Apache", "Log4j"],
    ["Citrix", "NetScaler"],
    ["Fortinet", "FortiOS"],
    ["VMware", "vCenter"],
    ["Cisco", "IOS XE"],
    ["Google", "Chrome"],
    ["Apple", "iOS"],
    ["Oracle", "WebLogic"],
    ["Progress", "MOVEit"],
    ["Atlassian", "Confluence"],
    ["Ivanti", "Connect Secure"],
  ];
  const statuses: ExploitStatus[] = ["ACTIVE", "POC", "THEORETICAL", "PATCHED"];
  const severities: Severity[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

  return Array.from({ length: count }, (_, i) => {
    const year = 2023 + (i % 3);
    const num = 10000 + i * 17;
    const vendor = pick(vendors, i);
    return {
      cveId: `CVE-${year}-${num}`,
      cvssScore: Math.round((5 + (i % 50) / 10) * 10) / 10,
      severity: pick(severities, i),
      exploitationStatus: pick(statuses, i),
      description: `Remote code execution vulnerability in ${vendor[1]} allowing unauthenticated attackers to execute arbitrary code in ${vendor[0]} deployments.`,
      affectedVendors: vendor,
      intelligenceScore: 50 + (i % 50),
      publishedAt: daysAgo(365 - i * 5),
    };
  });
}

export async function main() {
  console.log("Clearing existing data...");
  await clearDatabase();

  console.log("Seeding admin user...");
  const passwordHash = await hash(ADMIN_PASSWORD, 12);
  await prisma.user.create({
    data: {
      email: "admin@cyberblackmail.io",
      passwordHash,
      role: UserRole.ADMIN,
    },
  });

  console.log("Seeding countries...");
  const countryData = [
    { code: "US", name: "United States", region: "North America" },
    { code: "GB", name: "United Kingdom", region: "Europe" },
    { code: "DE", name: "Germany", region: "Europe" },
    { code: "FR", name: "France", region: "Europe" },
    { code: "UA", name: "Ukraine", region: "Europe" },
    { code: "RU", name: "Russia", region: "Europe" },
    { code: "CN", name: "China", region: "Asia" },
    { code: "KP", name: "North Korea", region: "Asia" },
    { code: "IR", name: "Iran", region: "Middle East" },
    { code: "IL", name: "Israel", region: "Middle East" },
    { code: "IN", name: "India", region: "Asia" },
    { code: "JP", name: "Japan", region: "Asia" },
    { code: "KR", name: "South Korea", region: "Asia" },
    { code: "AU", name: "Australia", region: "Oceania" },
    { code: "BR", name: "Brazil", region: "South America" },
    { code: "CA", name: "Canada", region: "North America" },
    { code: "NL", name: "Netherlands", region: "Europe" },
    { code: "SE", name: "Sweden", region: "Europe" },
    { code: "SG", name: "Singapore", region: "Asia" },
    { code: "AE", name: "United Arab Emirates", region: "Middle East" },
  ];
  const countries = await Promise.all(
    countryData.map((c, i) =>
      prisma.country.create({
        data: { ...c, intelligenceScore: 60 + (i % 40) },
      })
    )
  );
  const countryByCode = Object.fromEntries(countries.map((c) => [c.code, c]));

  console.log("Seeding industries...");
  const industryData = [
    { slug: "banking", name: "Banking", description: "Financial institutions and payment processors." },
    { slug: "healthcare", name: "Healthcare", description: "Hospitals, insurers, and medical device vendors." },
    { slug: "government", name: "Government", description: "Federal, state, and municipal agencies." },
    { slug: "energy", name: "Energy", description: "Oil, gas, utilities, and renewable infrastructure." },
    { slug: "telecom", name: "Telecom", description: "Carriers, ISPs, and network equipment providers." },
    { slug: "education", name: "Education", description: "Universities, research labs, and K-12 districts." },
    { slug: "retail", name: "Retail", description: "E-commerce platforms and brick-and-mortar chains." },
    { slug: "manufacturing", name: "Manufacturing", description: "Industrial control systems and supply chains." },
  ];
  const industries = await Promise.all(
    industryData.map((ind, i) =>
      prisma.industry.create({
        data: { ...ind, intelligenceScore: 55 + (i % 45) },
      })
    )
  );
  const industryBySlug = Object.fromEntries(industries.map((i) => [i.slug, i]));

  console.log("Seeding companies...");
  const companyData = [
    { slug: "microsoft", name: "Microsoft", industry: "Technology", headquarters: "Redmond, WA, USA" },
    { slug: "google", name: "Google", industry: "Technology", headquarters: "Mountain View, CA, USA" },
    { slug: "nvidia", name: "Nvidia", industry: "Technology", headquarters: "Santa Clara, CA, USA" },
    { slug: "oracle", name: "Oracle", industry: "Technology", headquarters: "Austin, TX, USA" },
    { slug: "cloudflare", name: "Cloudflare", industry: "Technology", headquarters: "San Francisco, CA, USA" },
    { slug: "apple", name: "Apple", industry: "Technology", headquarters: "Cupertino, CA, USA" },
    { slug: "amazon", name: "Amazon", industry: "Technology", headquarters: "Seattle, WA, USA" },
  ];
  const companies = await Promise.all(
    companyData.map((c, i) =>
      prisma.company.create({
        data: { ...c, intelligenceScore: 70 + (i % 30) },
      })
    )
  );
  const companyBySlug = Object.fromEntries(companies.map((c) => [c.slug, c]));

  console.log("Seeding threat actors...");
  const actorDefs = [
    {
      slug: "apt28",
      name: "APT28",
      aliases: ["Fancy Bear", "Sofacy", "STRONTIUM"],
      type: ActorType.APT,
      origin: "Russia",
      motivation: "Espionage and geopolitical influence",
      description:
        "State-sponsored group targeting government, defense, and media organizations with spear-phishing and credential theft campaigns.",
      ttps: ["T1566.001", "T1078", "T1059.001", "T1003"],
      targetSectors: ["Government", "Defense", "Media"],
      threatLevel: Severity.HIGH,
      countryCodes: ["RU", "US", "UA", "DE"],
    },
    {
      slug: "apt29",
      name: "APT29",
      aliases: ["Cozy Bear", "The Dukes", "NOBELIUM"],
      type: ActorType.APT,
      origin: "Russia",
      motivation: "Long-term espionage and supply chain compromise",
      description:
        "Sophisticated APT known for SolarWinds supply chain intrusion and cloud identity targeting across Western governments.",
      ttps: ["T1195.002", "T1078.004", "T1550.001", "T1027"],
      targetSectors: ["Government", "Technology", "Healthcare"],
      threatLevel: Severity.CRITICAL,
      countryCodes: ["RU", "US", "GB", "CA"],
    },
    {
      slug: "lazarus",
      name: "Lazarus Group",
      aliases: ["Hidden Cobra", "ZINC", "Labyrinth Chollima"],
      type: ActorType.APT,
      origin: "North Korea",
      motivation: "Financial gain and espionage",
      description:
        "DPRK-linked group conducting cryptocurrency theft, SWIFT banking attacks, and destructive wiper operations.",
      ttps: ["T1566.002", "T1486", "T1055", "T1105"],
      targetSectors: ["Finance", "Cryptocurrency", "Defense"],
      threatLevel: Severity.CRITICAL,
      countryCodes: ["KP", "US", "KR", "JP"],
    },
    {
      slug: "lockbit",
      name: "LockBit",
      aliases: ["LockBit 3.0", "LockBit Black"],
      type: ActorType.RANSOMWARE,
      origin: "Unknown",
      motivation: "Financial extortion via ransomware-as-a-service",
      description:
        "Prolific RaaS operation with automated affiliate model, double extortion, and rapid encryption of enterprise networks.",
      ttps: ["T1486", "T1490", "T1021.002", "T1562.001"],
      targetSectors: ["Healthcare", "Manufacturing", "Government"],
      threatLevel: Severity.CRITICAL,
      countryCodes: ["US", "GB", "DE", "FR"],
    },
    {
      slug: "cl0p",
      name: "Cl0p",
      aliases: ["TA505", "FIN11"],
      type: ActorType.RANSOMWARE,
      origin: "Unknown",
      motivation: "Financial extortion and data theft",
      description:
        "Group exploiting zero-day vulnerabilities in file transfer appliances to exfiltrate data before deploying ransomware.",
      ttps: ["T1190", "T1567.002", "T1486", "T1078"],
      targetSectors: ["Finance", "Healthcare", "Retail"],
      threatLevel: Severity.HIGH,
      countryCodes: ["US", "GB", "AU", "CA"],
    },
    {
      slug: "blackcat",
      name: "BlackCat",
      aliases: ["ALPHV", "Noberus"],
      type: ActorType.RANSOMWARE,
      origin: "Unknown",
      motivation: "Ransomware extortion with affiliate program",
      description:
        "Rust-based ransomware group using triple extortion tactics against critical infrastructure and legal firms.",
      ttps: ["T1486", "T1489", "T1567", "T1059.003"],
      targetSectors: ["Energy", "Legal", "Healthcare"],
      threatLevel: Severity.HIGH,
      countryCodes: ["US", "DE", "FR", "BR"],
    },
    {
      slug: "fin7",
      name: "FIN7",
      aliases: ["Carbanak", "Navigator Group"],
      type: ActorType.CYBERCRIME,
      origin: "Eastern Europe",
      motivation: "Financial fraud and POS compromise",
      description:
        "Organized cybercrime syndicate targeting retail and hospitality with custom backdoors and point-of-sale malware.",
      ttps: ["T1566.001", "T1059.001", "T1005", "T1041"],
      targetSectors: ["Retail", "Hospitality", "Finance"],
      threatLevel: Severity.HIGH,
      countryCodes: ["US", "GB", "AU", "DE"],
    },
    {
      slug: "volt-typhoon",
      name: "Volt Typhoon",
      aliases: ["BRONZE SILHOUETTE", "Vanguard Panda"],
      type: ActorType.APT,
      origin: "China",
      motivation: "Pre-positioning for critical infrastructure disruption",
      description:
        "PRC-linked actor living off the land in US critical infrastructure, focusing on communications and energy sectors.",
      ttps: ["T1078", "T1021.001", "T1003.003", "T1562.002"],
      targetSectors: ["Energy", "Telecom", "Government"],
      threatLevel: Severity.CRITICAL,
      countryCodes: ["CN", "US", "AU", "JP"],
    },
  ];

  const actors = await Promise.all(
    actorDefs.map((a, i) =>
      prisma.threatActor.create({
        data: {
          slug: a.slug,
          name: a.name,
          aliases: a.aliases,
          type: a.type,
          origin: a.origin,
          motivation: a.motivation,
          description: a.description,
          ttps: a.ttps,
          targetSectors: a.targetSectors,
          intelligenceScore: 75 + (i % 25),
          threatLevel: a.threatLevel,
        },
      })
    )
  );
  const actorBySlug = Object.fromEntries(actors.map((a) => [a.slug, a]));

  for (const def of actorDefs) {
    const actor = actorBySlug[def.slug];
    for (const code of def.countryCodes) {
      await prisma.threatActorOnCountry.create({
        data: { actorId: actor.id, countryId: countryByCode[code].id },
      });
    }
  }

  console.log("Seeding ransomware groups...");
  const ransomwareDefs = [
    {
      slug: "lockbit",
      name: "LockBit 3.0",
      status: GroupStatus.ACTIVE,
      victimCount: 2847,
      description: "Dominant RaaS ecosystem with leak site and automated negotiation portal.",
      industries: ["Healthcare", "Manufacturing", "Government"],
      countries: ["US", "GB", "DE"],
      actorSlug: "lockbit",
    },
    {
      slug: "cl0p",
      name: "Cl0p Ransomware",
      status: GroupStatus.ACTIVE,
      victimCount: 892,
      description: "Specializes in mass exploitation of file transfer zero-days for bulk data theft.",
      industries: ["Finance", "Retail", "Healthcare"],
      countries: ["US", "CA", "AU"],
      actorSlug: "cl0p",
    },
    {
      slug: "blackcat",
      name: "BlackCat / ALPHV",
      status: GroupStatus.DISRUPTED,
      victimCount: 654,
      description: "First major Rust-based ransomware; FBI disruption reduced operational tempo in 2024.",
      industries: ["Energy", "Legal", "Telecom"],
      countries: ["US", "FR", "BR"],
      actorSlug: "blackcat",
    },
    {
      slug: "akira",
      name: "Akira",
      status: GroupStatus.ACTIVE,
      victimCount: 412,
      description: "Emerging group targeting SMBs with double extortion and ESXi-focused encryption.",
      industries: ["Education", "Manufacturing", "Retail"],
      countries: ["US", "CA", "NL"],
      actorSlug: null,
    },
    {
      slug: "play",
      name: "Play Ransomware",
      status: GroupStatus.ACTIVE,
      victimCount: 378,
      description: "Exploits Fortinet and Exchange vulnerabilities; no public leak site, direct negotiation only.",
      industries: ["Telecom", "Government", "Energy"],
      countries: ["US", "JP", "SE"],
      actorSlug: null,
    },
    {
      slug: "royal",
      name: "Royal Ransomware",
      status: GroupStatus.INACTIVE,
      victimCount: 291,
      description: "Former Conti splinter group; operations wound down after leadership arrests.",
      industries: ["Healthcare", "Banking", "Manufacturing"],
      countries: ["US", "GB", "DE"],
      actorSlug: null,
    },
  ];

  for (const rg of ransomwareDefs) {
    await prisma.ransomwareGroup.create({
      data: {
        slug: rg.slug,
        name: rg.name,
        status: rg.status,
        victimCount: rg.victimCount,
        lastSeen: daysAgo(rg.status === GroupStatus.INACTIVE ? 180 : rg.victimCount % 30),
        description: rg.description,
        industries: rg.industries,
        countries: rg.countries,
        intelligenceScore: 60 + (rg.victimCount % 40),
        actorId: rg.actorSlug ? actorBySlug[rg.actorSlug].id : null,
      },
    });
  }

  console.log("Seeding CVEs...");
  const cveRecords = await Promise.all(
    buildCves(45).map((cve) => prisma.cVE.create({ data: cve }))
  );

  for (let i = 0; i < cveRecords.length; i++) {
    const actor = pick(actors, i);
    await prisma.cVEOnActor.create({
      data: { cveId: cveRecords[i].id, actorId: actor.id },
    });
  }

  console.log("Seeding IOCs...");
  const iocRecords = await Promise.all(
    buildIocs(120).map((ioc) => prisma.iOC.create({ data: ioc }))
  );

  console.log("Seeding RSS sources...");
  await prisma.source.createMany({
    data: [
      {
        name: "BleepingComputer",
        rssUrl: "https://www.bleepingcomputer.com/feed/",
        active: true,
        lastFetched: daysAgo(0),
      },
      {
        name: "The Record",
        rssUrl: "https://therecord.media/feed/",
        active: true,
        lastFetched: daysAgo(0),
      },
      {
        name: "CISA Alerts",
        rssUrl: "https://www.cisa.gov/cybersecurity-advisories/all.xml",
        active: true,
        lastFetched: daysAgo(1),
      },
      {
        name: "Krebs on Security",
        rssUrl: "https://krebsonsecurity.com/feed/",
        active: true,
        lastFetched: daysAgo(0),
      },
    ],
  });

  console.log("Seeding campaigns...");
  const campaignDefs = [
    { name: "Operation GhostWriter", actorSlug: "apt28", industrySlug: "government", days: 120 },
    { name: "SolarWinds Fallout", actorSlug: "apt29", industrySlug: "government", days: 200 },
    { name: "TraderTraitor Crypto Heists", actorSlug: "lazarus", industrySlug: "banking", days: 90 },
    { name: "LockBit Affiliates Wave", actorSlug: "lockbit", industrySlug: "healthcare", days: 60 },
    { name: "MOVEit Mass Exploitation", actorSlug: "cl0p", industrySlug: "retail", days: 45 },
    { name: "Critical Infrastructure Pre-positioning", actorSlug: "volt-typhoon", industrySlug: "energy", days: 150 },
  ];

  const campaigns = await Promise.all(
    campaignDefs.map((c) =>
      prisma.campaign.create({
        data: {
          name: c.name,
          description: `Ongoing campaign tracked by CyberBlackmail analysts targeting ${c.industrySlug} sector assets.`,
          startDate: daysAgo(c.days),
          endDate: c.days > 100 ? null : daysAgo(5),
          actorId: actorBySlug[c.actorSlug].id,
          industryId: industryBySlug[c.industrySlug].id,
        },
      })
    )
  );

  // Article definitions continue in seedArticles helper below
  await seedArticles({
    actors,
    actorBySlug,
    companies,
    companyBySlug,
    countries,
    countryByCode,
    industries,
    industryBySlug,
    cveRecords,
    iocRecords,
    campaigns,
  });

  console.log("Seeding daily briefings...");
  for (let i = 0; i < 7; i++) {
    await prisma.dailyBriefing.create({
      data: {
        date: dateOnly(i),
        topThreats: {
          items: [
            { name: "LockBit 3.0", severity: "CRITICAL", change: "+12%" },
            { name: "Volt Typhoon", severity: "CRITICAL", change: "+8%" },
            { name: "Cl0p MOVEit Exploits", severity: "HIGH", change: "-3%" },
          ],
        },
        majorBreaches: {
          items: [
            { org: pick(companies, i).name, records: `${(i + 1) * 1.2}M`, sector: pick(industries, i).name },
            { org: "Regional Health Network", records: "890K", sector: "Healthcare" },
          ],
        },
        ransomwareActivity: {
          newVictims: 14 + i,
          activeGroups: ["LockBit", "Akira", "Play"],
          topSector: pick(industries, i + 2).name,
        },
        aptCampaigns: {
          active: [pick(actorDefs, i).name, pick(actorDefs, i + 1).name],
          regions: [pick(countries, i).name, pick(countries, i + 3).name],
        },
        vulnerabilityHighlights: {
          cves: [cveRecords[i].cveId, cveRecords[i + 5].cveId, cveRecords[i + 10].cveId],
          exploitedInWild: i % 2 === 0,
        },
      },
    });
  }

  console.log("Seed completed successfully.");
}

type SeedContext = {
  actors: Awaited<ReturnType<typeof prisma.threatActor.create>>[];
  actorBySlug: Record<string, Awaited<ReturnType<typeof prisma.threatActor.create>>>;
  companies: Awaited<ReturnType<typeof prisma.company.create>>[];
  companyBySlug: Record<string, Awaited<ReturnType<typeof prisma.company.create>>>;
  countries: Awaited<ReturnType<typeof prisma.country.create>>[];
  countryByCode: Record<string, Awaited<ReturnType<typeof prisma.country.create>>>;
  industries: Awaited<ReturnType<typeof prisma.industry.create>>[];
  industryBySlug: Record<string, Awaited<ReturnType<typeof prisma.industry.create>>>;
  cveRecords: Awaited<ReturnType<typeof prisma.cVE.create>>[];
  iocRecords: Awaited<ReturnType<typeof prisma.iOC.create>>[];
  campaigns: Awaited<ReturnType<typeof prisma.campaign.create>>[];
};

const TIMELINE_STAGES: TimelineStage[] = [
  TimelineStage.RECONNAISSANCE,
  TimelineStage.INITIAL_ACCESS,
  TimelineStage.PRIVILEGE_ESCALATION,
  TimelineStage.LATERAL_MOVEMENT,
  TimelineStage.DATA_EXFILTRATION,
  TimelineStage.RANSOM_DEMAND,
  TimelineStage.RESOLUTION,
];

async function seedArticles(ctx: SeedContext) {
  const { actors, actorBySlug, companies, companyBySlug, countries, countryByCode, industries, industryBySlug, cveRecords, iocRecords, campaigns } = ctx;

  const articleDefs: {
    title: string;
    category: Category;
    severity: Severity;
    source: string;
    actorSlugs: string[];
    companySlugs: string[];
    daysAgo: number;
    summary: string;
    vector: string;
    industry: string;
    withIncident?: boolean;
    withBreach?: boolean;
  }[] = [
    { title: "LockBit Affiliates Hit Major US Hospital Network", category: Category.RANSOMWARE, severity: Severity.CRITICAL, source: "CyberBlackmail Intel", actorSlugs: ["lockbit"], companySlugs: [], daysAgo: 2, summary: "Ransomware encrypted 4,200 endpoints across 12 facilities.", vector: "Phishing email with malicious attachment", industry: "Healthcare", withIncident: true, withBreach: true },
    { title: "APT29 Targets Cloud Identity Providers in NATO States", category: Category.APT, severity: Severity.CRITICAL, source: "Mandiant", actorSlugs: ["apt29"], companySlugs: ["microsoft"], daysAgo: 5, summary: "OAuth token theft campaign against diplomatic entities.", vector: "OAuth consent phishing", industry: "Government", withIncident: true },
    { title: "Cl0p Exploits New Zero-Day in Enterprise File Transfer Suite", category: Category.ZERO_DAY, severity: Severity.CRITICAL, source: "CISA Advisory", actorSlugs: ["cl0p"], companySlugs: ["oracle"], daysAgo: 3, summary: "Mass exploitation of unpatched file transfer appliances.", vector: "Unauthenticated RCE", industry: "Finance", withIncident: true, withBreach: true },
    { title: "Lazarus Group Steals $47M from DeFi Protocol", category: Category.BREAKING_BREACH, severity: Severity.HIGH, source: "Chainalysis", actorSlugs: ["lazarus"], companySlugs: [], daysAgo: 7, summary: "Social engineering of developer keys led to smart contract drain.", vector: "Supply chain compromise", industry: "Banking", withBreach: true },
    { title: "Volt Typhoon Detected in US Energy Grid OT Networks", category: Category.APT, severity: Severity.CRITICAL, source: "FBI Flash", actorSlugs: ["volt-typhoon"], companySlugs: [], daysAgo: 10, summary: "Living-off-the-land activity in SCADA-adjacent systems.", vector: "Valid account abuse", industry: "Energy", withIncident: true },
    { title: "BlackCat Resurfaces with New Leak Site Infrastructure", category: Category.RANSOMWARE, severity: Severity.HIGH, source: "Recorded Future", actorSlugs: ["blackcat"], companySlugs: [], daysAgo: 14, summary: "Group reconstituted affiliate portal on new Tor hidden services.", vector: "RDP brute force", industry: "Legal", withIncident: true },
    { title: "FIN7 Deploys Custom Backdoor Against Retail POS Systems", category: Category.THREAT_INTEL, severity: Severity.HIGH, source: "Proofpoint", actorSlugs: ["fin7"], companySlugs: ["amazon"], daysAgo: 8, summary: "Carbanak variant observed in holiday shopping season attacks.", vector: "Spear-phishing", industry: "Retail", withIncident: true },
    { title: "APT28 Phishing Campaign Impersonates Ukrainian Government", category: Category.APT, severity: Severity.HIGH, source: "CERT-UA", actorSlugs: ["apt28"], companySlugs: [], daysAgo: 12, summary: "Credential harvesting targeting military procurement officers.", vector: "Credential phishing", industry: "Government", withIncident: true },
    { title: "Darknet Market Lists 12 Million Stolen Credentials", category: Category.DARKNET, severity: Severity.MEDIUM, source: "CyberBlackmail Darknet Monitor", actorSlugs: [], companySlugs: ["google"], daysAgo: 1, summary: "Combo list tied to infostealer logs from 2024 campaigns.", vector: "Infostealer malware", industry: "Technology", withBreach: true },
    { title: "Microsoft Patches Actively Exploited Edge Zero-Day", category: Category.ZERO_DAY, severity: Severity.CRITICAL, source: "Microsoft MSRC", actorSlugs: [], companySlugs: ["microsoft"], daysAgo: 4, summary: "Type confusion bug exploited in targeted attacks before patch Tuesday.", vector: "Drive-by download", industry: "Technology", withIncident: true },
    { title: "Cloudflare Mitigates Record 5.6 Tbps DDoS Attack", category: Category.CYBER_DEFENSE, severity: Severity.MEDIUM, source: "Cloudflare Blog", actorSlugs: [], companySlugs: ["cloudflare"], daysAgo: 6, summary: "UDP-based volumetric attack against financial services customer.", vector: "UDP reflection amplification", industry: "Banking" },
    { title: "Nvidia Internal Tools Exposed in Third-Party Breach", category: Category.DATA_LEAK, severity: Severity.HIGH, source: "CyberBlackmail Intel", actorSlugs: [], companySlugs: ["nvidia"], daysAgo: 20, summary: "Contractor credentials led to exposure of internal documentation.", vector: "Third-party compromise", industry: "Technology", withBreach: true },
    { title: "Apple Zero-Click iMessage Exploit Sold on Exploit Broker Forum", category: Category.DARKNET, severity: Severity.CRITICAL, source: "Darknet Monitor", actorSlugs: ["apt28"], companySlugs: ["apple"], daysAgo: 15, summary: "FORCEDENTRY-style chain listed for $2.5M on underground market.", vector: "Zero-click exploit", industry: "Technology", withIncident: true },
    { title: "LockBit Claims Oracle Cloud Customer Data Theft", category: Category.RANSOMWARE, severity: Severity.HIGH, source: "LockBit Leak Site", actorSlugs: ["lockbit"], companySlugs: ["oracle"], daysAgo: 18, summary: "Affiliate posted 800GB archive allegedly from managed services client.", vector: "VPN credential theft", industry: "Technology", withBreach: true },
    { title: "German Energy Provider Hit by Akira Ransomware", category: Category.RANSOMWARE, severity: Severity.HIGH, source: "BSI Alert", actorSlugs: ["lockbit"], companySlugs: [], daysAgo: 9, summary: "OT network segmentation prevented full grid disruption.", vector: "VPN vulnerability", industry: "Energy", withIncident: true },
    { title: "Healthcare Data Broker Leaks 3.2M Patient Records", category: Category.DATA_LEAK, severity: Severity.CRITICAL, source: "HHS OCR", actorSlugs: [], companySlugs: [], daysAgo: 11, summary: "Misconfigured S3 bucket exposed PHI across 14 states.", vector: "Cloud misconfiguration", industry: "Healthcare", withBreach: true },
    { title: "APT29 SolarWinds TTPs Reused in SaaS Supply Chain Attack", category: Category.APT, severity: Severity.CRITICAL, source: "CrowdStrike", actorSlugs: ["apt29"], companySlugs: ["microsoft"], daysAgo: 25, summary: "OAuth application abuse mirrors 2020 supply chain intrusion patterns.", vector: "Malicious OAuth app", industry: "Government" },
    { title: "Lazarus Fake Job Offer Campaign Targets Crypto Engineers", category: Category.THREAT_INTEL, severity: Severity.HIGH, source: "Google TAG", actorSlugs: ["lazarus"], companySlugs: ["google"], daysAgo: 16, summary: "Contagious Interview malware delivered via fake recruiter profiles.", vector: "Social engineering", industry: "Technology", withIncident: true },
    { title: "Cl0p Victims Surpass 600 Organizations Post-MOVEit", category: Category.BREAKING_BREACH, severity: Severity.CRITICAL, source: "CyberBlackmail Intel", actorSlugs: ["cl0p"], companySlugs: [], daysAgo: 30, summary: "Continued exploitation of unpatched file transfer instances.", vector: "SQL injection", industry: "Retail", withBreach: true },
    { title: "Volt Typhoon Router Implant Found in Telecom Backbone", category: Category.THREAT_INTEL, severity: Severity.CRITICAL, source: "NSA Advisory", actorSlugs: ["volt-typhoon"], companySlugs: [], daysAgo: 22, summary: "Custom implant on edge routers enables persistent covert access.", vector: "Firmware implant", industry: "Telecom", withIncident: true },
    { title: "FIN7 Uses AI-Generated Voice Deepfakes in Vishing Attacks", category: Category.THREAT_INTEL, severity: Severity.MEDIUM, source: "IBM X-Force", actorSlugs: ["fin7"], companySlugs: [], daysAgo: 13, summary: "CFO impersonation led to $2.1M wire transfer fraud.", vector: "Voice phishing", industry: "Banking", withIncident: true },
    { title: "Play Ransomware Exploits Fortinet Zero-Day in Government Sector", category: Category.ZERO_DAY, severity: Severity.CRITICAL, source: "CISA KEV", actorSlugs: [], companySlugs: [], daysAgo: 19, summary: "Unauthenticated RCE in FortiOS leveraged for initial access.", vector: "Edge device RCE", industry: "Government", withIncident: true },
    { title: "Amazon AWS Misconfiguration Exposes 1.4M Customer Records", category: Category.BREAKING_BREACH, severity: Severity.HIGH, source: "CyberBlackmail Intel", actorSlugs: [], companySlugs: ["amazon"], daysAgo: 28, summary: "Publicly accessible RDS snapshot discovered by security researcher.", vector: "Cloud misconfiguration", industry: "Retail", withBreach: true },
    { title: "APT28 DNC-Style Disinformation Campaign Ahead of Elections", category: Category.APT, severity: Severity.HIGH, source: "Microsoft DTI", actorSlugs: ["apt28"], companySlugs: ["microsoft"], daysAgo: 21, summary: "Coordinated inauthentic behavior on social platforms identified.", vector: "Influence operations", industry: "Government", withIncident: true },
    { title: "BlackCat Affiliate Targets Legal Firm Client Privilege Data", category: Category.RANSOMWARE, severity: Severity.HIGH, source: "FBI IC3", actorSlugs: ["blackcat"], companySlugs: [], daysAgo: 24, summary: "Attorney-client privileged documents posted to leak site.", vector: "Citrix NetScaler exploit", industry: "Legal", withBreach: true },
    { title: "Global Education Consortium Suffers Ransomware Outage", category: Category.RANSOMWARE, severity: Severity.MEDIUM, source: "EDUCAUSE", actorSlugs: ["lockbit"], companySlugs: [], daysAgo: 17, summary: "Student records systems offline for 72 hours during finals week.", vector: "Remote desktop compromise", industry: "Education", withIncident: true, withBreach: true },
    { title: "Manufacturing Giant Hit by Supply Chain Ransomware", category: Category.RANSOMWARE, severity: Severity.HIGH, source: "CyberBlackmail Intel", actorSlugs: ["lockbit"], companySlugs: [], daysAgo: 26, summary: "Production lines halted across three continents.", vector: "Supply chain partner compromise", industry: "Manufacturing", withIncident: true },
    { title: "Defensive Guide: Hardening Identity Against APT29 TTPs", category: Category.CYBER_DEFENSE, severity: Severity.LOW, source: "CyberBlackmail Research", actorSlugs: ["apt29"], companySlugs: ["microsoft"], daysAgo: 35, summary: "Practical mitigations for OAuth abuse and token theft.", vector: "Defensive guidance", industry: "Government" },
    { title: "Darknet Ransomware Negotiator Service Exposed", category: Category.DARKNET, severity: Severity.MEDIUM, source: "Darknet Monitor", actorSlugs: ["lockbit", "blackcat"], companySlugs: [], daysAgo: 32, summary: "Underground broker facilitating ransom payments for multiple groups.", vector: "Ransom facilitation", industry: "Finance" },
    { title: "Telecom Provider BGP Hijack Routes Traffic Through Adversary AS", category: Category.THREAT_INTEL, severity: Severity.HIGH, source: "Cloudflare Radar", actorSlugs: ["volt-typhoon"], companySlugs: ["cloudflare"], daysAgo: 27, summary: "18-minute hijack redirected traffic for cryptocurrency platforms.", vector: "BGP route hijacking", industry: "Telecom", withIncident: true },
  ];

  const incidentCoords = [
    { lat: 38.9072, lng: -77.0369, country: "US", city: "Washington DC", code: "US" },
    { lat: 51.5074, lng: -0.1278, country: "GB", city: "London", code: "GB" },
    { lat: 52.52, lng: 13.405, country: "DE", city: "Berlin", code: "DE" },
    { lat: 48.8566, lng: 2.3522, country: "FR", city: "Paris", code: "FR" },
    { lat: 50.4501, lng: 30.5234, country: "UA", city: "Kyiv", code: "UA" },
    { lat: 55.7558, lng: 37.6173, country: "RU", city: "Moscow", code: "RU" },
    { lat: 39.9042, lng: 116.4074, country: "CN", city: "Beijing", code: "CN" },
    { lat: 37.5665, lng: 126.978, country: "KR", city: "Seoul", code: "KR" },
    { lat: 35.6762, lng: 139.6503, country: "JP", city: "Tokyo", code: "JP" },
    { lat: -33.8688, lng: 151.2093, country: "AU", city: "Sydney", code: "AU" },
    { lat: -23.5505, lng: -46.6333, country: "BR", city: "São Paulo", code: "BR" },
    { lat: 43.6532, lng: -79.3832, country: "CA", city: "Toronto", code: "CA" },
    { lat: 52.3676, lng: 4.9041, country: "NL", city: "Amsterdam", code: "NL" },
    { lat: 59.3293, lng: 18.0686, country: "SE", city: "Stockholm", code: "SE" },
    { lat: 28.6139, lng: 77.209, country: "IN", city: "New Delhi", code: "IN" },
    { lat: 32.0853, lng: 34.7818, country: "IL", city: "Tel Aviv", code: "IL" },
    { lat: 35.6892, lng: 51.389, country: "IR", city: "Tehran", code: "IR" },
    { lat: 1.3521, lng: 103.8198, country: "SG", city: "Singapore", code: "SG" },
    { lat: 25.2048, lng: 55.2708, country: "AE", city: "Dubai", code: "AE" },
    { lat: 40.7128, lng: -74.006, country: "US", city: "New York", code: "US" },
    { lat: 34.0522, lng: -118.2437, country: "US", city: "Los Angeles", code: "US" },
    { lat: 47.6062, lng: -122.3321, country: "US", city: "Seattle", code: "US" },
    { lat: 41.8781, lng: -87.6298, country: "US", city: "Chicago", code: "US" },
    { lat: 29.7604, lng: -95.3698, country: "US", city: "Houston", code: "US" },
    { lat: 33.4484, lng: -112.074, country: "US", city: "Phoenix", code: "US" },
  ];

  console.log("Seeding articles and related entities...");
  let incidentIndex = 0;
  let breachIndex = 0;

  for (let i = 0; i < articleDefs.length; i++) {
    const def = articleDefs[i];
    const slug = slugify(def.title);
    const publishedAt = daysAgo(def.daysAgo);
    const industrySlug = slugify(def.industry);
    const matchedIndustry = industryBySlug[industrySlug] ?? pick(industries, i);

    const ru = ARTICLE_RU[i];
    const article = await prisma.article.create({
      data: {
        slug,
        title: def.title,
        excerpt: def.summary,
        content: `${def.summary}\n\nCyberBlackmail analysts have confirmed indicators linking this incident to ongoing threat activity. Organizations in the ${def.industry} sector should review detection rules for ${def.vector.toLowerCase()} and validate backup integrity.\n\nKey findings:\n- Attack vector: ${def.vector}\n- Severity: ${def.severity}\n- Category: ${def.category}\n\nRecommended actions include threat hunting across identity logs, network egress monitoring, and patch verification for known exploited vulnerabilities.`,
        titleRu: ru.title,
        excerptRu: ru.summary,
        contentRu: buildArticleContentRu(ru, SEVERITY_RU[def.severity], CATEGORY_RU[def.category]),
        severity: def.severity,
        category: def.category,
        intelligenceScore: 60 + (i % 40),
        source: def.source,
        sourceUrl: `https://cyberblackmail.io/intel/${slug}`,
        readTime: 4 + (i % 8),
        publishedAt,
      },
    });

    await prisma.threatAnalysis.create({
      data: {
        articleId: article.id,
        executiveSummary: def.summary,
        attackVector: def.vector,
        impact: `Significant operational and reputational impact across ${def.industry} sector targets. Potential regulatory notification requirements depending on data exposure scope.`,
        targetIndustry: def.industry,
        executiveSummaryRu: ru.summary,
        attackVectorRu: ru.vector,
        impactRu: buildImpactRu(ru.industry),
        targetIndustryRu: ru.industry,
        iocIndicators: {
          ips: [iocRecords[i % iocRecords.length].value],
          domains: [iocRecords[(i + 3) % iocRecords.length].value],
          hashes: [iocRecords[(i + 7) % iocRecords.length].value],
        },
        mitigations: {
          immediate: ["Isolate affected systems", "Reset compromised credentials", "Enable enhanced logging"],
          strategic: ["Deploy EDR across endpoints", "Implement MFA for all remote access", "Conduct tabletop exercises"],
          ru: MITIGATIONS_RU,
        },
      },
    });

    for (let s = 0; s < TIMELINE_STAGES.length; s++) {
      await prisma.threatTimelineEvent.create({
        data: {
          stage: TIMELINE_STAGES[s],
          timestamp: new Date(publishedAt.getTime() - (TIMELINE_STAGES.length - s) * 3600000 * 6),
          title: `${TIMELINE_STAGES[s].replace(/_/g, " ")} detected`,
          description: `Analysts identified ${TIMELINE_STAGES[s].toLowerCase().replace(/_/g, " ")} activity consistent with ${def.actorSlugs[0] ?? "unknown"} TTPs during incident response.`,
          order: s + 1,
          articleId: article.id,
        },
      });
    }

    for (const actorSlug of def.actorSlugs) {
      if (actorBySlug[actorSlug]) {
        await prisma.threatActorOnArticle.create({
          data: { actorId: actorBySlug[actorSlug].id, articleId: article.id },
        });
      }
    }

    for (const companySlug of def.companySlugs) {
      if (companyBySlug[companySlug]) {
        await prisma.companyOnArticle.create({
          data: { companyId: companyBySlug[companySlug].id, articleId: article.id },
        });
      }
    }

    for (let c = 0; c < 3; c++) {
      await prisma.cVEOnArticle.create({
        data: { cveId: cveRecords[(i + c) % cveRecords.length].id, articleId: article.id },
      });
    }

    for (let j = 0; j < 4; j++) {
      await prisma.iOCOnArticle.create({
        data: {
          iocId: iocRecords[(i * 4 + j) % iocRecords.length].id,
          articleId: article.id,
        },
      });
    }

    if (def.withIncident && incidentIndex < 25) {
      const coord = incidentCoords[incidentIndex];
      const countryRef = countryByCode[coord.code] ?? pick(countries, incidentIndex);
      const incident = await prisma.incident.create({
        data: {
          lat: coord.lat,
          lng: coord.lng,
          country: coord.country,
          countryId: countryRef.id,
          city: coord.city,
          type: def.category.replace(/_/g, " "),
          severity: def.severity,
          intelligenceScore: 55 + (incidentIndex % 45),
          articleId: article.id,
          companyId: def.companySlugs[0] ? companyBySlug[def.companySlugs[0]]?.id : pick(companies, incidentIndex).id,
          industryId: matchedIndustry.id,
        },
      });

      for (let t = 0; t < 3; t++) {
        await prisma.threatTimelineEvent.create({
          data: {
            stage: pick(TIMELINE_STAGES, t + incidentIndex),
            timestamp: daysAgo(def.daysAgo - t),
            title: `Incident phase ${t + 1}`,
            description: `Field telemetry from ${coord.city} correlates with ${def.title}.`,
            order: t + 1,
            incidentId: incident.id,
            campaignId: pick(campaigns, incidentIndex).id,
          },
        });
      }

      for (let j = 0; j < 3; j++) {
        await prisma.iOCOnIncident.create({
          data: {
            iocId: iocRecords[(incidentIndex * 3 + j) % iocRecords.length].id,
            incidentId: incident.id,
          },
        });
      }
      incidentIndex++;
    }

    if (def.withBreach && breachIndex < 20) {
      await prisma.breach.create({
        data: {
          organization: def.companySlugs[0]
            ? companyBySlug[def.companySlugs[0]].name
            : `${def.industry} Organization ${breachIndex + 1}`,
          recordsExposed: `${(breachIndex + 1) * 125}K`,
          dataTypes: ["PII", "Credentials", "Financial Records"].slice(0, 1 + (breachIndex % 3)),
          industry: def.industry,
          breachDate: daysAgo(def.daysAgo + 5),
          severity: def.severity,
          intelligenceScore: 50 + (breachIndex % 50),
          articleId: article.id,
          companyId: def.companySlugs[0] ? companyBySlug[def.companySlugs[0]]?.id : pick(companies, breachIndex).id,
          industryId: matchedIndustry.id,
        },
      });
      breachIndex++;
    }
  }

  while (incidentIndex < 25) {
    const coord = incidentCoords[incidentIndex];
    const countryRef = countryByCode[coord.code] ?? pick(countries, incidentIndex);
    const incident = await prisma.incident.create({
      data: {
        lat: coord.lat,
        lng: coord.lng,
        country: coord.country,
        countryId: countryRef.id,
        city: coord.city,
        type: "Ransomware",
        severity: pick(["CRITICAL", "HIGH", "MEDIUM"] as Severity[], incidentIndex),
        intelligenceScore: 50 + (incidentIndex % 50),
        companyId: pick(companies, incidentIndex).id,
        industryId: pick(industries, incidentIndex).id,
      },
    });
    for (let j = 0; j < 2; j++) {
      await prisma.iOCOnIncident.create({
        data: {
          iocId: iocRecords[(incidentIndex * 2 + j + 60) % iocRecords.length].id,
          incidentId: incident.id,
        },
      });
    }
    incidentIndex++;
  }

  while (breachIndex < 20) {
    const company = pick(companies, breachIndex);
    const industry = pick(industries, breachIndex);
    await prisma.breach.create({
      data: {
        organization: company.name,
        recordsExposed: `${(breachIndex + 5) * 200}K`,
        dataTypes: ["PII", "Source Code", "API Keys"].slice(0, 1 + (breachIndex % 2)),
        industry: industry.name,
        breachDate: daysAgo(breachIndex * 3 + 10),
        severity: pick(["CRITICAL", "HIGH", "MEDIUM"] as Severity[], breachIndex),
        intelligenceScore: 45 + (breachIndex % 55),
        companyId: company.id,
        industryId: industry.id,
      },
    });
    breachIndex++;
  }

  console.log("Seeding alerts...");
  const alertMessages = [
    "Critical: LockBit affiliate activity detected in healthcare sector",
    "High: New APT29 OAuth phishing templates observed",
    "Critical: Unpatched Fortinet devices under active exploitation",
    "High: Cl0p MOVEit indicators found in client environment",
    "Medium: Suspicious Tor exit node communication detected",
    "Critical: Volt Typhoon TTPs matched in energy sector logs",
    "High: Lazarus cryptocurrency phishing campaign active",
    "Medium: FIN7 vishing attempts reported by member firms",
    "High: BlackCat leak site updated with new victims",
    "Critical: Zero-day exploit chain targeting Edge browser",
    "High: Mass credential stuffing against retail portals",
    "Medium: Darknet market listing matches internal breach data",
    "High: BGP hijack affecting financial services traffic",
    "Critical: Ransomware encryption detected on backup servers",
    "High: APT28 spear-phishing targeting government contractors",
    "Medium: Anomalous data egress to known C2 infrastructure",
    "High: Supply chain compromise indicators in npm packages",
    "Critical: Active exploitation of Citrix NetScaler CVE",
    "High: Akira ransomware IOCs observed in SMB networks",
    "Medium: Stolen session tokens sold on underground forum",
  ];

  const allArticles = await prisma.article.findMany({ take: 20, orderBy: { publishedAt: "desc" } });
  for (let i = 0; i < alertMessages.length; i++) {
    await prisma.alert.create({
      data: {
        message: alertMessages[i],
        messageRu: ALERT_MESSAGES_RU[i],
        severity: pick(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as Severity[], i),
        articleId: i < allArticles.length ? allArticles[i].id : null,
        createdAt: daysAgo(i % 7),
      },
    });
  }

  await seedForum();
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
