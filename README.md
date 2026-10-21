# ReelMind

Веб-приложение для сохранения ссылок (Instagram, YouTube, статьи и любые URL) и автоматической сортировки по категориям (здоровье, мотивация, бизнес, ИИ-сервисы и др.). У каждого пользователя свой каталог.

## Локальный запуск (фаза 1)

1. Скопируйте переменные окружения:

   ```bash
   cp .env.example .env.local
   ```

2. Установите зависимости и поднимите БД:

   ```bash
   npm install
   npm run db:setup
   ```

3. Запустите dev-сервер:

   ```bash
   npm run dev
   ```

4. Откройте [http://localhost:3000](http://localhost:3000), зарегистрируйтесь и добавьте первую ссылку.

### AI-классификация

Добавьте в `.env.local` один из ключей (приоритет сверху вниз):

- `GOOGLE_GENERATIVE_AI_API_KEY` или `GEMINI_API_KEY` (`gemini-3.5-flash-lite` для категорий и поиска, `gemini-embedding-001` для смысла)
- `OPENAI_API_KEY` (запасной вариант эмбеддингов и классификации)
- `ANTHROPIC_API_KEY`

Без ключа работает упрощённая keyword-классификация; поиск — только по словам. С ключом Gemini каталог ищет и по смыслу.

### Превью на карточках

- **Реальные сохранения:** картинка берётся из Open Graph / YouTube oEmbed / Instagram oEmbed (`META_OEMBED_ACCESS_TOKEN` для Instagram). Это превью **конкретной ссылки**, не «фото категории».
- **Если превью нет:** fallback (цвет + emoji категории). Для новой категории достаточно `CATEGORY_SEED` с emoji и color.
- **Demo seed / `USE_MOCK_DATA`:** стабильные picsum-превью по `id` записи (`demoThumbnailUrl`) только для демо.

### Добавление ссылок

- **Вручную:** [http://localhost:3000/add](http://localhost:3000/add) — любой URL + опционально заметка.
- **Share (PWA):**
  - **Android:** установите PWA → в Instagram «Поделиться» появится ReelMind (`share_target` → `/share`).
  - **iPhone:** iOS **не** поддерживает Share Target — иконки в Instagram не будет. В Instagram: Поделиться → Скопировать ссылку → откройте ReelMind → «Вставить из буфера» на `/add`.
  - На localhost для Android-теста нужен HTTPS/tunnel.

## Стек

- Next.js 16, React, TypeScript, Tailwind
- SQLite `local.db` (libSQL) + Drizzle ORM
- Vercel AI SDK

## API (Hono)

Все `/api/*` обслуживает **Hono** (`src/server/hono`, catch-all `src/app/api/[[...route]]`).

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/health` | Проверка API |
| POST | `/api/items/ingest` | `{ url?, text? }`, нужна сессия |
| GET | `/api/items?category=` | Список сохранений текущего пользователя |
| GET | `/api/categories` | Категории и счётчики |
| PATCH | `/api/items/:id` | `{ categorySlug }` |
| DELETE | `/api/items/:id` | Удаление |

Формы в UI используют Server Actions — секрет в браузер не нужен.

## Моки

`USE_MOCK_DATA=true` — in-memory данные без SQLite (только для вёрстки).

## Деплой (Vercel + Turso)

1. Проверьте production-сборку: `npm run build`
2. Создайте БД Turso, прогоните `db:push`, `db:seed`, `admin:sync` с prod URL
3. Подключите репозиторий к Vercel и задайте переменные из [Context/DEPLOY.md](Context/DEPLOY.md)

Шаблон env: `.env.example` (файл можно коммитить; секреты — только в Vercel / `.env.local`).

Контекст проекта: [Context/README.md](Context/README.md), план: [Context/PLAN.md](Context/PLAN.md)
