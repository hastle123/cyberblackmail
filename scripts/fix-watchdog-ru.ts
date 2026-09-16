import dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(process.cwd(), ".env.local"), override: true });
import { PrismaClient } from "@prisma/client";
import { translateArticleToRussian } from "../src/lib/llm/translate-ru";
import { isArticleTranslated, hasQualityRussianBody } from "../src/lib/article-translated";

const MANUAL: Record<string, { titleRu: string; excerptRu: string; contentRu: string }> = {
  "scattered-spider-members-plead-guilty-to-hacking-transport-for-london": {
    titleRu: "Участники Scattered Spider признали вину во взломе Transport for London",
    excerptRu:
      "Два участника группы Scattered Spider признали вину во взломе систем Transport for London в 2024 году — ущерб исчисляется миллионами фунтов.",
    contentRu: `Два участника киберпреступной группы Scattered Spider признали вину во взломе систем Transport for London (TfL) в 2024 году.

Речь идёт о Thalha Jubair (20 лет) и Owen Flowers (18 лет), которые получили доступ к инфраструктуре лондонского транспортного оператора с 31 августа по 3 сентября 2024 года. По оценкам, инцидент обошёлся в миллионы фунтов стерлингов.

Ранее оба отрицали причастность, однако в ходе судебного разбирательства признали вину. Scattered Spider известна атаками на крупные организации с использованием социальной инженерии и компрометации учётных записей.

Источник: BleepingComputer.`,
  },
  "a-week-in-security-june-15-8211-june-21": {
    titleRu: "Неделя в безопасности (15–21 июня)",
    excerptRu: "Еженедельный дайджест Malwarebytes Labs с главными новостями кибербезопасности за 15–21 июня.",
    contentRu: `Malwarebytes Labs публикует еженедельный обзор «A week in security» — краткий дайджест важнейших событий в сфере кибербезопасности.

Выпуск за 15–21 июня 2026 года доступен на сайте Malwarebytes. RSS-лента содержит только анонс рассылки; полный список материалов — по ссылке на оригинальную публикацию.

Источник: Malwarebytes Labs.`,
  },
};

async function main() {
  const prisma = new PrismaClient();
  for (const [slug, manual] of Object.entries(MANUAL)) {
    const article = await prisma.article.findUnique({
      where: { slug },
      select: { id: true, title: true, excerpt: true, content: true, source: true },
    });
    if (!article) {
      console.log("skip:", slug);
      continue;
    }

    let data = manual;
    if (slug === "scattered-spider-members-plead-guilty-to-hacking-transport-for-london") {
      try {
        const tr = await translateArticleToRussian(article);
        if (
          isArticleTranslated({ title: article.title, titleRu: tr.titleRu }) &&
          hasQualityRussianBody(tr.contentRu)
        ) {
          data = { titleRu: tr.titleRu, excerptRu: tr.excerptRu, contentRu: tr.contentRu };
          console.log(slug, "ollama OK");
        } else {
          console.log(slug, "manual");
        }
      } catch {
        console.log(slug, "manual (ollama fail)");
      }
    } else {
      console.log(slug, "manual");
    }

    await prisma.article.update({ where: { id: article.id }, data });
    if (slug === "scattered-spider-members-plead-guilty-to-hacking-transport-for-london") {
      await prisma.article.update({
        where: { id: article.id },
        data: { titleRu: manual.titleRu },
      });
      data.titleRu = manual.titleRu;
    }
    console.log(" ", data.titleRu.slice(0, 70));
  }
  await prisma.$disconnect();
}
main();
