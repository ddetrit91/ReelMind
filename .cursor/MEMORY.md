# Memory — ReelMind (для агента)

**Читать в начале сессии** вместе с [TASK.md](./TASK.md) и [Context/](../Context/README.md).

## Что это за проект

PWA-подобное веб-приложение (Memo-style): пользователь сохраняет ссылки Instagram (Reels/посты), AI раскладывает по категориям (здоровье, мотивация, бизнес, ИИ-сервисы и т.д.). Mobile-first UI.

## Фаза

- **Сейчас:** фаза 1 — всё локально, SQLite `local.db`.
- **Потом:** фаза 2 — Vercel + Turso ([Context/DEPLOY.md](../Context/DEPLOY.md)), код менять минимально.

## Стек

| Часть | Технология |
|-------|------------|
| App | Next.js 16 App Router, React 19, TypeScript, Tailwind 4 |
| DB | SQLite `file:local.db` через `@libsql/client` + Drizzle ORM |
| AI | Vercel AI SDK — `OPENAI_API_KEY` или `ANTHROPIC_API_KEY`; иначе keyword fallback |
| PWA | `src/app/manifest.ts`, share target → `/share` |

## Ключевые пути

```
src/app/page.tsx              — главная, chips + сетка
src/app/add/page.tsx          — ручное добавление
src/app/share/page.tsx        — Web Share Target (ingest + redirect)
src/app/items/[id]/page.tsx   — детали, смена категории
src/app/api/items/ingest/     — POST ingest (x-ingest-secret)
src/lib/ingest/process-ingest.ts
src/lib/ai/classify.ts
src/lib/db/schema.ts
src/lib/actions.ts            — Server Actions (формы без секрета в браузере)
```

## Env (`.env.local`)

- `TURSO_DATABASE_URL=file:local.db`
- `INGEST_SECRET=dev-secret` — для API POST
- `USE_MOCK_DATA=false` — true только для UI без БД
- LLM-ключ — опционально, но желателен

## Решения (не ломать без причины)

1. **Instagram:** не полагаться на парсинг; главный сигнал для AI — `share_text` + поле на `/add`.
2. **Auth:** нет в MVP; данные глобальные для одного пользователя.
3. **Ingest:** формы → Server Actions; внешний API → `x-ingest-secret`.
4. **Next 16:** на страницах с БД — `export const instant = false` (совместимо с `cacheComponents`).
5. **Правила проекта:** `.cursor/rules/` — JS stack, mobile UI skills, mock data when no API.

## Команды

```bash
npm run db:setup   # push + seed
npm run dev        # http://localhost:3000
npm run build
```

## Категории (seed)

`health`, `motivation`, `business`, `ai-tools`, `finance`, `education`, `lifestyle`, `other` — см. `src/lib/categories.ts`. Обложка категории — `categoryCoverUrl`, превью карточки — из OG/oEmbed источника.

Поиск каталога: слова + смысл. С Gemini — `gemini-embedding-001` и расширение запроса через `gemini-3.5-flash-lite`; без эмбеддингов — ранжирование той же моделью. OpenAI embeddings — запасной вариант.

## Обновление этого файла

После значимых архитектурных решений или смены фазы — добавить датированный блок в конец (как в Context/MEMORY.md).
