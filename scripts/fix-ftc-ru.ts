import dotenv from "dotenv";
import { resolve } from "path";

dotenv.config();
dotenv.config({ path: resolve(process.cwd(), ".env.local"), override: true });

import { PrismaClient } from "@prisma/client";
import { RSS_PARSER_HEADERS } from "../src/lib/ingest/rss-headers";
import { enrichArticleById } from "../src/lib/ingest/enrich-article";
import { translateArticleToRussian } from "../src/lib/llm/translate-ru";
import {
  hasEnglishLeakInRussian,
  hasQualityRussianBody,
  isArticleTranslated,
} from "../src/lib/article-translated";
import { isRssSummaryOnly } from "../src/lib/article-text";
import { estimateReadTime } from "../src/lib/ingest/classify";

const MANUAL_RU: Record<string, { titleRu: string; excerptRu: string; contentRu: string }> = {
  "searching-for-health-insurance-keep-scrolling-to-avoid-government-impersonators": {
    titleRu: "Ищете страховку? Не кликайте по первой ссылке — там могут быть мошенники",
    excerptRu:
      "Мошенники покупают рекламу в поиске и выдают себя за государственные программы вроде Medicare. FTC объясняет, как не попасться.",
    contentRu: `Федеральная торговая комиссия США (FTC) предупреждает: при поиске медицинской страховки или программ вроде Medicare многие пользователи нажимают на первый результат в Google — и попадают на сайты мошенников.

Злоумышленники покупают контекстную рекламу и создают страницы, похожие на официальные порталы государственных служб. Там могут просить личные данные, номер Social Security или оплату за «оформление» полиса, которого не существует.

Как защититься:
• Не доверяйте первой рекламной ссылке — прокручивайте до официальных сайтов (.gov).
• Medicare и Medicaid не звонят сами и не просят оплату по телефону за «активацию».
• Проверяйте адрес сайта: gov-сайты США заканчиваются на .gov.
• Сомневаетесь — звоните на официальный номер с сайта medicare.gov, а не по номеру из объявления.

Если вы уже передали данные или деньги мошенникам, подайте жалобу на reportfraud.ftc.gov.`,
  },
  "ignore-calls-texts-and-emails-threatening-to-arrest-you-for-missing-jury-duty": {
    titleRu: "Угрозы арестом за «пропуск» jury duty — это мошенничество",
    excerptRu:
      "Звонки, SMS и письма о «ордере на арест» за неявку в суд присяжных — типичная схема FTC. Деньги не переводите.",
    contentRu: `FTC предупреждает о волне мошенничества под видом уведомлений о пропуске jury duty (службы присяжных заседателей).

Схема выглядит так: звонок с сообщением, что вы не явились в суд и должны немедленно заплатить штраф. Затем приходит SMS или email с «официальными» документами и угрозой ордера на арест. Всё это призвано напугать и заставить перевести деньги.

Важно знать:
• Настоящий суд не требует оплату по телефону, картой или криптовалютой.
• Судебные повестки не приходят в виде угроз арестом за «неоплату» в тот же день.
• Никогда не переводите деньги и не покупайте подарочные карты по требованию звонящего.
• Не открывайте вложения в письмах от неизвестных «судебных служб».

Если получили такое сообщение — положите трубку, не отвечайте на SMS и не переходите по ссылкам. Жалобу можно подать на reportfraud.ftc.gov.`,
  },
  "how-to-avoid-a-travel-scam-this-summer": {
    titleRu: "Как не попасть на туристическое мошенничество этим летом",
    excerptRu:
      "Летом мошенники активно предлагают «суперскидки» на отдых. FTC перечисляет признаки travel-scam и способы защиты.",
    contentRu: `Летний сезон — пик туристических мошенничеств. FTC напоминает: пока вы ищете дешёвые билеты и отели, мошенники ищут способ добраться до ваших денег.

Типичные схемы:
• «Эксклюзивные» туры и аренда жилья по цене сильно ниже рынка — часто фото и описание украдены с других сайтов.
• Давление «акция только сегодня» и требование оплатить сразу картой, переводом или криптой.
• Фальшивые сайты бронирования, копирующие известные сервисы (Airbnb, Booking и др.).
• Письма о «проблеме с бронированием» со ссылкой на поддельную страницу входа.

Как не стать жертвой:
• Сравнивайте цены на официальных сайтах и проверенных агрегаторах.
• Оплачивайте картой — так проще оспорить списание при мошенничестве.
• Не переходите по ссылкам из неожиданных писем и SMS — открывайте сайт вручную.
• Проверяйте отзывы и адрес объекта на карте; при аренде жилья общайтесь только через платформу.

Подозрительное предложение — жалоба на reportfraud.ftc.gov.`,
  },
};

const SLUGS = Object.keys(MANUAL_RU);

function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s*Read more\s*>?\s*$/i, "")
    .trim();
}

function extractFtcBody(html: string): string {
  const patterns = [
    /<div[^>]*class="[^"]*field--name-body[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/(?:div|article)/i,
    /<article[^>]*>([\s\S]*?)<\/article>/i,
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) {
      const text = htmlToText(m[1]);
      if (text.length > 320) return text.slice(0, 12000);
    }
  }
  return "";
}

async function fetchFtcFullText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: RSS_PARSER_HEADERS,
      signal: AbortSignal.timeout(25_000),
      redirect: "follow",
    });
    if (!res.ok) return null;
    const html = await res.text();
    const body = extractFtcBody(html);
    return body.length > 320 ? body : null;
  } catch {
    return null;
  }
}

async function main() {
  const prisma = new PrismaClient();

  for (const slug of SLUGS) {
    process.stdout.write(`\n[${slug}] `);

    const article = await prisma.article.findUnique({
      where: { slug },
      select: {
        id: true,
        title: true,
        excerpt: true,
        content: true,
        sourceUrl: true,
      },
    });

    if (!article) {
      console.log("NOT FOUND");
      continue;
    }

    if (isRssSummaryOnly(article.excerpt, article.content, article.sourceUrl)) {
      process.stdout.write("fetch…");
      const full = article.sourceUrl ? await fetchFtcFullText(article.sourceUrl) : null;
      if (full) {
        const excerpt = full.slice(0, 280) + (full.length > 280 ? "…" : "");
        await prisma.article.update({
          where: { id: article.id },
          data: {
            excerpt,
            content: full,
            readTime: estimateReadTime(`${article.title} ${full}`),
          },
        });
        console.log(` OK ${full.length}ch`);
      } else {
        const en = await enrichArticleById(article.id);
        console.log(` ${en.status}`);
      }
    }

    const manual = MANUAL_RU[slug];
    let titleRu = manual.titleRu;
    let excerptRu = manual.excerptRu;
    let contentRu = manual.contentRu;

    const fresh = await prisma.article.findUnique({
      where: { slug },
      select: { title: true, excerpt: true, content: true, source: true, sourceUrl: true },
    });

    if (fresh && !isRssSummaryOnly(fresh.excerpt, fresh.content, fresh.sourceUrl)) {
      process.stdout.write("translate fulltext…");
      try {
        const tr = await translateArticleToRussian(fresh);
        if (
          isArticleTranslated({ title: fresh.title, titleRu: tr.titleRu }) &&
          hasQualityRussianBody(tr.contentRu)
        ) {
          titleRu = tr.titleRu;
          excerptRu = tr.excerptRu;
          contentRu = tr.contentRu;
          console.log(" OK");
        } else {
          console.log(" manual");
        }
      } catch {
        console.log(" manual");
      }
    } else {
      console.log(" manual RU");
    }

    if (hasEnglishLeakInRussian(titleRu) || hasEnglishLeakInRussian(excerptRu)) {
      console.log(" FAIL english leak");
      continue;
    }

    await prisma.article.update({
      where: { slug },
      data: { titleRu, excerptRu, contentRu },
    });

    const ok =
      isArticleTranslated({ title: article.title, titleRu }) &&
      hasQualityRussianBody(contentRu);
    console.log(ok ? " saved OK" : " saved WARN");
    console.log(" ", titleRu.slice(0, 85));
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
