import dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(process.cwd(), ".env.local"), override: true });
import { PrismaClient } from "@prisma/client";
import { enrichArticleById } from "../src/lib/ingest/enrich-article";
import { translateArticleToRussian } from "../src/lib/llm/translate-ru";

const SLUG = "sim-swapping-gang-busted-in-international-police-operation";

const MANUAL = {
  titleRu: "Группу SIM-swap мошенников задержали в ходе международной операции",
  excerptRu:
    "Польская киберполиция совместно с ФБР и HSI арестовала четырёх подозреваемых в SIM-swap атаках, краже криптовалюты и отмывании денег.",
  contentRu: `Сотрудники Центрального бюро по борьбе с киберпреступностью Польши (CBZC) задержали четырёх предполагаемых участников организованной группы, обвиняемых в SIM-swap атаках, краже криптовалюты и отмывании средств.

В операции участвовали агенты ФБР США и подразделения Homeland Security Investigations (HSI). Расследование курирует региональная прокуратура в Кракове и продолжается.

По данным следствия, участники группы, действуя в рамках организованной структуры, целенаправленно взламывали IT-инфраструктуру жертв для перехвата SIM-карт и доступа к аккаунтам, после чего похищали криптовалюту.

SIM-swap — схема, при которой злоумышленники переводят номер телефона жертвы на свою SIM-карту и обходят двухфакторную аутентификацию по SMS.

Источник: Help Net Security.`,
};

async function main() {
  const prisma = new PrismaClient();
  const article = await prisma.article.findUnique({
    where: { slug: SLUG },
    select: { id: true, title: true, excerpt: true, content: true, source: true, sourceUrl: true },
  });
  if (!article) {
    console.log("not found");
    return;
  }

  console.log("enrich…");
  const en = await enrichArticleById(article.id);
  console.log(en);

  const fresh = await prisma.article.findUnique({
    where: { slug: SLUG },
    select: { title: true, excerpt: true, content: true, source: true },
  });
  if (!fresh) return;

  console.log("EN len after enrich:", fresh.content.length);

  let data = MANUAL;
  if (fresh.content.length > 800 && !fresh.content.includes("More →")) {
    try {
      const tr = await translateArticleToRussian(fresh);
      if (!tr.contentRu.includes("purpose") && !tr.contentRu.includes("…")) {
        data = { titleRu: tr.titleRu, excerptRu: tr.excerptRu, contentRu: tr.contentRu };
        console.log("ollama OK");
      }
    } catch {
      console.log("ollama fail, manual");
    }
  }

  await prisma.article.update({
    where: { id: article.id },
    data: {
      titleRu: data.titleRu,
      excerptRu: data.excerptRu,
      contentRu: data.contentRu,
    },
  });
  console.log("saved:", data.titleRu);
  await prisma.$disconnect();
}
main();
