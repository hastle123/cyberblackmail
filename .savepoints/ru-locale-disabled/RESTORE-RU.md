# Russian locale — disabled 2026-06-18

RU site and `/ru/forum` are **turned off**. English only (`/`, `/forum`, etc.).

Nothing was deleted:
- `messages/ru.json` — still in project
- DB fields `titleRu`, forum RU seed content — unchanged
- Translation scripts — unchanged

## Backup copy

`.savepoints/ru-locale-disabled/` — snapshot of `routing.ts`, `middleware.ts`, `ru.json`

## Restore Russian (one line)

In `src/i18n/routing.ts`:

```ts
export const RU_LOCALE_ENABLED = true;
```

Restart dev server. Switcher EN/RU returns; `/ru` and `/ru/forum` work again.

## What changes when disabled

| Before | Now |
|--------|-----|
| `/` + `/ru` | `/` only |
| `/forum` + `/ru/forum` | `/forum` only |
| EN/RU switcher in header | hidden |
| `/ru/...` URLs | redirect to same path without `/ru` |

Say **«верни ru»** to re-enable.
