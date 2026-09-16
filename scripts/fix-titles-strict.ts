import dotenv from "dotenv";
import { resolve } from "path";

dotenv.config();
dotenv.config({ path: resolve(process.cwd(), ".env.local"), override: true });

import { PrismaClient } from "@prisma/client";
import { ollamaGenerate } from "../src/lib/llm/ollama";
import {
  hasEnglishLeakInRussian,
  isArticleTranslated,
  cyrillicLetterRatio,
  hasGarbageMixedScript,
  isRuTitleAcceptable,
} from "../src/lib/article-translated";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function strictTitle(en: string, attempt: number): Promise<string> {
  const strict = attempt > 1;
  const out = await ollamaGenerate(
    strict
      ? `Переведи заголовок новости на русский. Запрещены английские слова. Только кириллица и имена брендов.\n${en}`
      : `Переведи заголовок новости о кибербезопасности на русский язык.\nПравила: только русский; бренды/CVE/имена оставь латиницей; без английских слов.\n\n${en}`,
    {
      system: "Ты редактор русскоязычного сайта о кибербезопасности. Ответь одной строкой — только перевод заголовка.",
      timeoutMs: 120_000,
    },
  );
  return out.trim().replace(/^["«]|["»]$/g, "");
}

async function strictExcerpt(en: string, titleRu: string): Promise<string> {
  const src = en.trim().slice(0, 480);
  if (!src) return titleRu;
  try {
    const out = await ollamaGenerate(
      `Переведи на русский (1–2 предложения):\n${src}`,
      {
        system: "Только русский текст. Без английских слов кроме брендов и CVE.",
        timeoutMs: 120_000,
      },
    );
    const t = out.trim();
    if (!hasEnglishLeakInRussian(t) && !hasGarbageMixedScript(t) && cyrillicLetterRatio(t) >= 0.5) {
      return t;
    }
  } catch {
    /* fallback */
  }
  return titleRu;
}

async function findBad(prisma: PrismaClient) {
  const all = await prisma.article.findMany({
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      titleRu: true,
      excerptRu: true,
    },
  });
  return all.filter(
    (a) =>
      !a.titleRu?.trim() ||
      !isRuTitleAcceptable(a.title, a.titleRu) ||
      hasEnglishLeakInRussian(a.excerptRu ?? "") ||
      hasGarbageMixedScript(a.excerptRu ?? "") ||
      hasGarbageMixedScript(a.titleRu),
  );
}

async function main() {
  const prisma = new PrismaClient();

  // Restore known-good manual fixes
  const manual: Record<string, { titleRu: string; excerptRu: string }> = {
    "new-prinz-eugen-ransomware-prioritizes-recent-files-for-encryption": {
      titleRu: "Новый вымогатель Prinz Eugen шифрует в первую очередь недавно изменённые файлы",
      excerptRu:
        "Операция Prinz Eugen отдаёт приоритет недавно изменённым файлам при шифровании и не оставляет записку с требованием выкупа. Исследование Threatdown показало, что злоумышленники действуют вручную.",
    },
    "microsoft-patches-actively-exploited-edge-zero-day": {
      titleRu: "Microsoft закрыла активно эксплуатируемую zero-day уязвимость в Edge",
      excerptRu: "Microsoft выпустила патч для уязвимости нулевого дня в браузере Edge, которую уже используют злоумышленники.",
    },
    "microsoft-fixes-windows-server-2016-security-update-failures": {
      titleRu: "Microsoft исправила сбои обновлений безопасности Windows Server 2016",
      excerptRu: "Компания устранила проблемы, из-за которых не устанавливались накопительные обновления безопасности на Windows Server 2016.",
    },
    "microsoft-june-2026-windows-updates-break-recycle-bin-prompts": {
      titleRu: "Июньские обновления Windows 2026 ломают работу корзины",
      excerptRu: "После установки июньских патчей Windows у части пользователей перестала корректно работать корзина и диалоги удаления файлов.",
    },
    "who-runs-the-ransomware-group-the-gentlemen": {
      titleRu: "Кто стоит за группой вымогателей Gentlemen",
      excerptRu: "Разбор инфраструктуры и тактик группы Gentlemen, специализирующейся на шифровании данных и отключении средств защиты.",
    },
    "rokarolla-android-malware-can-take-over-your-phone-and-steal-banking-logins": {
      titleRu: "Вредонос Rokarolla для Android перехватывает телефон и крадёт банковские данные",
      excerptRu: "Новая Android-вредоносная кампания получает полный контроль над устройством и похищает учётные данные для банковских приложений.",
    },
  };

  for (const [slug, ru] of Object.entries(manual)) {
    await prisma.article.updateMany({ where: { slug }, data: ru });
    console.log("manual:", slug);
  }

  const bad = await findBad(prisma);
  console.log(`Need title fix: ${bad.length}`);

  let ok = 0;
  let fail = 0;

  for (const article of bad) {
    if (manual[article.slug]) continue;
    process.stdout.write(`[${article.slug}] `);

    let titleRu = "";
    for (let i = 0; i < 4; i++) {
      try {
        titleRu = await strictTitle(article.title, i);
        if (isRuTitleAcceptable(article.title, titleRu)) break;
      } catch {
        /* retry */
      }
      await sleep(1000);
    }

    if (!isRuTitleAcceptable(article.title, titleRu)) {
      fail++;
      console.log("FAIL title");
      continue;
    }

    const excerptRu = await strictExcerpt(article.excerpt || article.title, titleRu);
    await prisma.article.update({
      where: { id: article.id },
      data: { titleRu, excerptRu },
    });
    ok++;
    console.log("OK");
    console.log(" ", titleRu.slice(0, 85));
    await sleep(500);
  }

  const left = await findBad(prisma);
  console.log(`\nDone. OK: ${ok}, fail: ${fail}, still bad: ${left.length}`);
  left.forEach((a) => console.log(" -", a.slug));
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
