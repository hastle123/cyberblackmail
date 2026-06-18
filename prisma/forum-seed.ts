import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

const CATEGORIES = [
  {
    slug: "general",
    name: "General Discussion",
    nameRu: "Общее",
    description: "Community chat, introductions, and off-topic security talk.",
    descriptionRu: "Общение, знакомства и обсуждения вне основных тем.",
    sortOrder: 0,
  },
  {
    slug: "threat-intel",
    name: "Threat Intelligence",
    nameRu: "Разведка угроз",
    description: "Share IOCs, TTPs, campaign analysis, and attribution debates.",
    descriptionRu: "IOC, TTP, разбор кампаний и дискуссии об атрибуции.",
    sortOrder: 1,
  },
  {
    slug: "ransomware",
    name: "Ransomware",
    nameRu: "Ransomware",
    description: "LockBit, Cl0p, negotiation tactics, and recovery stories.",
    descriptionRu: "Группы, переговоры, восстановление и индикаторы.",
    sortOrder: 2,
  },
  {
    slug: "vulnerabilities",
    name: "Vulnerabilities",
    nameRu: "Уязвимости",
    description: "CVE discussion, exploit chains, and patch prioritization.",
    descriptionRu: "CVE, цепочки эксплойтов и приоритизация патчей.",
    sortOrder: 3,
  },
  {
    slug: "defense",
    name: "Defense & OPSEC",
    nameRu: "Защита и OPSEC",
    description: "Blue team playbooks, hardening, and operational security.",
    descriptionRu: "Blue team, hardening и операционная безопасность.",
    sortOrder: 4,
  },
] as const;

const TOPICS = [
  {
    category: "threat-intel",
    title: "FIN7 vishing with AI voice clones — what are you seeing?",
    titleRu: "FIN7 и AI-клоны голоса в vishing — что видите в поле?",
    content:
      "We've had three clients report CFO impersonation calls that sounded identical to internal leadership. Indicators point to FIN7-style playbooks but with real-time voice synthesis. Curious if others are correlating similar TTPs this quarter.",
    contentRu:
      "У трёх клиентов были звонки с имитацией CFO — голос почти неотличим от реального. Похоже на FIN7, но с синтезом голоса в реальном времени. Есть ли у кого похожие TTP в этом квартале?",
    authorName: "analyst_m",
    isPinned: true,
    daysAgo: 1,
    replies: [
      {
        authorName: "bluelead",
        content: "Same here in EU financials. We blocked after callback verification policy failed on the second attempt.",
        contentRu: "То же в EU-финансах. Остановили после того, как политика callback не сработала со второй попытки.",
        daysAgo: 0,
      },
      {
        authorName: "ir_volunteer",
        content: "Check for fresh OAuth consent phishing paired with the call — we saw that combo last week.",
        contentRu: "Проверьте свежий OAuth consent phishing в паре со звонком — видели такую связку на прошлой неделе.",
        daysAgo: 0,
      },
    ],
  },
  {
    category: "ransomware",
    title: "Akira vs LockBit 3.0 — negotiation timelines compared",
    titleRu: "Akira vs LockBit 3.0 — сравнение сроков переговоров",
    content:
      "Documenting response timelines from two incidents this month. Akira moved faster on proof-of-data but accepted lower initial offers. LockBit was slower but demanded full ransom. Sharing anonymized timelines for peer review.",
    contentRu:
      "Сравниваю сроки по двум инцидентам в этом месяце. Akira быстрее давала proof-of-data, но соглашалась на меньшие суммы. LockBit тянула время, но требовала полный выкуп.",
    authorName: "incident_ops",
    isPinned: false,
    daysAgo: 2,
    replies: [
      {
        authorName: "legal_counsel",
        content: "Please redact any victim-identifying metadata before posting timelines.",
        contentRu: "Уберите любые идентифицирующие жертву детали перед публикацией таймлайнов.",
        daysAgo: 1,
      },
    ],
  },
  {
    category: "vulnerabilities",
    title: "Citrix NetScaler — are you still seeing active exploitation?",
    titleRu: "Citrix NetScaler — всё ещё видите активную эксплуатацию?",
    content:
      "Patching backlog is brutal. Looking for field reports on whether mass exploitation is still ongoing or if defenders have contained the blast radius.",
    contentRu:
      "Бэклог патчей жёсткий. Ищу полевые отчёты: массовая эксплуатация продолжается или уже локализовали?",
    authorName: "patch_tuesday",
    isPinned: false,
    daysAgo: 3,
    replies: [],
  },
  {
    category: "defense",
    title: "Minimum viable logging for SMB without a SOC",
    titleRu: "Минимальный набор логов для SMB без SOC",
    content:
      "Building a pragmatic checklist for 200-seat orgs: EDR + DNS + email + cloud identity. What would you add or cut?",
    contentRu:
      "Собираю чеклист для ~200 человек: EDR + DNS + почта + cloud identity. Что добавить или убрать?",
    authorName: "defense_builder",
    isPinned: false,
    daysAgo: 4,
    replies: [
      {
        authorName: "soc_lite",
        content: "Add proxy/SWG logs if budget allows. Identity is non-negotiable.",
        contentRu: "Если бюджет есть — proxy/SWG. Identity обязателен.",
        daysAgo: 3,
      },
    ],
  },
  {
    category: "general",
    title: "Welcome to CyberBlackmail Forum",
    titleRu: "Добро пожаловать на форум CyberBlackmail",
    content:
      "This is the community branch of CyberBlackmail — practitioner discussion separate from our editorial intel feed. Be specific, cite sources when you can, and no victim shaming.",
    contentRu:
      "Это сообщество CyberBlackmail — обсуждения практиков отдельно от редакционной ленты. Будьте конкретны, по возможности указывайте источники, без травли жертв.",
    authorName: "CyberBlackmail",
    isPinned: true,
    daysAgo: 7,
    replies: [
      {
        authorName: "new_member",
        content: "Glad this exists. The intel site is great but needed a place to compare notes.",
        contentRu: "Рад, что появилось место сравнить заметки — сайт с новостями отличный.",
        daysAgo: 6,
      },
    ],
  },
] as const;

export async function seedForum() {
  console.log("Seeding forum...");

  const existing = await prisma.forumCategory.count();
  if (existing > 0) {
    console.log("Forum already seeded, skipping.");
    return;
  }

  const categories = new Map<string, string>();
  for (const cat of CATEGORIES) {
    const row = await prisma.forumCategory.create({ data: cat });
    categories.set(cat.slug, row.id);
  }

  for (const topic of TOPICS) {
    const categoryId = categories.get(topic.category);
    if (!categoryId) continue;

    const baseSlug = slugify(topic.title);
    const createdAt = daysAgo(topic.daysAgo);
    const lastReply = topic.replies[0] ? daysAgo(topic.replies[0].daysAgo) : null;

    const row = await prisma.forumTopic.create({
      data: {
        slug: baseSlug,
        title: topic.title,
        titleRu: topic.titleRu,
        content: topic.content,
        contentRu: topic.contentRu,
        authorName: topic.authorName,
        isPinned: topic.isPinned,
        viewCount: 40 + topic.replies.length * 12,
        categoryId,
        createdAt,
        lastReplyAt: lastReply ?? createdAt,
      },
    });

    for (const reply of topic.replies) {
      await prisma.forumPost.create({
        data: {
          topicId: row.id,
          authorName: reply.authorName,
          content: reply.content,
          contentRu: reply.contentRu,
          createdAt: daysAgo(reply.daysAgo),
        },
      });
    }
  }

  console.log("Forum seeded.");
}

const isDirectRun = process.argv[1]?.replace(/\\/g, "/").endsWith("prisma/forum-seed.ts");
if (isDirectRun) {
  void seedForum()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
