# План — ReelMind (MVP)

## Цель

Сохранять ссылки Instagram (Reels/посты), автоматически раскладывать по категориям и быстро находить нужное по chips на главной.

## Фаза 1 (локально) — текущая

- Next.js App Router + TypeScript + Tailwind
- SQLite файл `local.db` через `@libsql/client` + Drizzle
- API: ingest, categories, items, PATCH категории
- PWA manifest + Web Share Target → `/share`
- AI-классификация (OpenAI/Anthropic) с keyword fallback
- Экраны: `/`, `/add`, `/items/[id]`, `/share`

## Фаза 2 (позже)

- Turso cloud + Vercel — см. [DEPLOY.md](./DEPLOY.md)
- Auth, полнотекстовый поиск, транскрипты — вне MVP

## Команды

```bash
cp .env.example .env.local
npm install
npm run db:setup
npm run dev
```

Открыть http://localhost:3000
