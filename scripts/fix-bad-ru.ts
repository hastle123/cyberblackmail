import dotenv from "dotenv";
import { resolve } from "path";

dotenv.config();
dotenv.config({ path: resolve(process.cwd(), ".env.local"), override: true });

import { PrismaClient } from "@prisma/client";
import {
  hasEnglishLeakInRussian,
  hasQualityRussianBody,
  isArticleTranslated,
} from "../src/lib/article-translated";

const prisma = new PrismaClient();

const FIXES: Record<
  string,
  { titleRu: string; excerptRu: string; contentRu?: string }
> = {
  "new-prinz-eugen-ransomware-prioritizes-recent-files-for-encryption": {
    titleRu:
      "Новый вымогатель Prinz Eugen шифрует в первую очередь недавно изменённые файлы",
    excerptRu:
      "Операция Prinz Eugen отдаёт приоритет недавно изменённым файлам при шифровании и не оставляет записку с требованием выкупа на системе. Исследование Threatdown (подразделение Malwarebytes для бизнеса) показало, что злоумышленники действуют вручную с клавиатуры.",
  },
};

async function main() {
  for (const [slug, ru] of Object.entries(FIXES)) {
    const article = await prisma.article.findUnique({ where: { slug } });
    if (!article) {
      console.log("skip (not found):", slug);
      continue;
    }

    const contentRu =
      ru.contentRu ??
      (article.contentRu?.includes("— Источник:")
        ? article.contentRu
        : `${article.contentRu ?? article.content}\n\n— Источник: ${article.source}. Материал подготовлен редакцией CyberBlackmail.`);

    await prisma.article.update({
      where: { id: article.id },
      data: { titleRu: ru.titleRu, excerptRu: ru.excerptRu, contentRu },
    });

    console.log("fixed:", slug);
    console.log(
      "ok:",
      isArticleTranslated({ title: article.title, titleRu: ru.titleRu }),
      !hasEnglishLeakInRussian(ru.titleRu),
      hasQualityRussianBody(contentRu),
    );
  }

  // Scan for other bad titles
  const all = await prisma.article.findMany({
    select: { slug: true, title: true, titleRu: true, excerptRu: true },
  });
  const bad = all.filter(
    (a) =>
      a.titleRu &&
      (hasEnglishLeakInRussian(a.titleRu) || hasEnglishLeakInRussian(a.excerptRu ?? "")),
  );
  if (bad.length) {
    console.log("\nStill need fix:");
    bad.forEach((a) => console.log(" -", a.slug));
  }
}

main().finally(() => prisma.$disconnect());
