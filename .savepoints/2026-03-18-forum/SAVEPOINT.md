# Savepoint — 2026-03-18 (before next prompt)

Full project mirror (without `node_modules` / `.next`):

`C:\Users\Klohk\OneDrive\Рабочий стол\sitesite-savepoint-2026-03-18_*`

## What is saved in this state

- CyberBlackmail news site (EN `/`, RU `/ru`)
- **Forum** branch: `/forum`, `/ru/forum` (categories, topics, replies, API)
- Wordmark: Newsreader editorial (Cyber + Blackmail, red bar)
- RSS ingest + translation pipeline
- `isArticleTranslated` fix in `src/lib/article-translated.ts`
- Prisma forum models: `ForumCategory`, `ForumTopic`, `ForumPost`

## Restore this version

1. Stop dev server (`npm run dev`)
2. Copy backup folder over `sitesite` (or rename folders)
3. Run: `npm install` → `npx prisma generate` → `npm run dev`
4. If DB missing: `npm run db:setup` or `npx tsx prisma/forum-seed.ts`

## Note

Git is not configured on this machine. This folder backup is the rollback point.
