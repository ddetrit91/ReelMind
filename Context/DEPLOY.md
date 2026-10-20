# Деплой ReelMind — Vercel + Turso

Приложение — один Next.js-проект (UI + API + Server Actions). На Vercel **нельзя** использовать `file:local.db`; нужна облачная БД **Turso** (тот же Drizzle/libSQL, другие env).

## 1. Turso

1. [Turso CLI](https://docs.turso.tech/cli/installation) → `turso auth login`
2. Создать БД (имя на ваш выбор):

   ```bash
   turso db create reelmind
   ```

3. URL и токен:

   ```bash
   turso db show reelmind --url
   turso db tokens create reelmind
   ```

4. **Схема и seed с вашей машины** (подставьте URL и token):

   ```bash
   set TURSO_DATABASE_URL=libsql://...
   set TURSO_AUTH_TOKEN=...
   npm run db:push
   npm run db:seed
   npm run admin:sync
   ```

   На macOS/Linux используйте `export` вместо `set`.

   `db:seed` — категории; `admin:sync` — пользователь из `ADMIN_EMAIL` / `ADMIN_PASSWORD` (ес заданы в env при запуске).

## 2. Vercel

1. Импорт репозитория, Framework **Next.js**, Build: `npm run build`, Output: default.
2. **Environment Variables** (Production; при необходимости Preview):

   | Переменная | Обязательно | Описание |
   |------------|-------------|----------|
   | `TURSO_DATABASE_URL` | да | libsql URL из `turso db show` |
   | `TURSO_AUTH_TOKEN` | да | Токен Turso |
   | `USE_MOCK_DATA` | да | `false` |
   | `INGEST_SECRET` | да | Длинный случайный секрет (не `dev-secret`) |
   | `GOOGLE_GENERATIVE_AI_API_KEY` или `GEMINI_API_KEY` | рекомендуется | Классификация и смысловой поиск |
   | `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` | опционально | Запасные LLM |
   | `ADMIN_EMAIL` | для первого админа | Email входа |
   | `ADMIN_PASSWORD` | для первого админа | ≥ 8 символов; синхронизируется при `admin:sync` / входе |
   | `ADMIN_NAME` | опционально | Отображаемое имя |
   | `META_OEMBED_ACCESS_TOKEN` | опционально | Превью Instagram |

3. Deploy. После первого деплоя при необходимости снова выполните `npm run admin:sync` локально с prod URL, если админ не создался на этапе seed.

## 3. Проверка после деплоя

- [ ] `/login` — вход и регистрация (если не включён maintenance / закрыта регистрация в админке)
- [ ] Главная — категории и карточки
- [ ] `/add` — сохранение ссылки
- [ ] Поиск `?q=...`
- [ ] `/admin` — только для role `admin`
- [ ] PWA: manifest, share target → `/share` (нужен HTTPS — на Vercel есть)
- [ ] `npm run build` локально проходит без ошибок перед push

## 4. Миграции при изменении схемы

Локально против prod Turso:

```bash
TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... npm run db:push
```

Коммитьте изменения `src/lib/db/schema.ts`; отдельный migration SQL в репозитории не обязателен, пока используется `drizzle-kit push`.

## 5. Частые проблемы

- **Build падает на Vercel** — убедитесь, что `TURSO_*` заданы до build (Next может обращаться к БД при сборке на некоторых маршрутах; у нас страницы с БД помечены `instant = false` и `connection()` где нужно).
- **`file:local.db` on Vercel** — клиент БД явно запрещает file-URL при `VERCEL=1`.
- **Пустой каталог** — seed не гоняли на prod; выполните `db:seed`. Демо-записи привязаны к userId при первом входе пользователя (см. `ensureDemoItemsForUser` в seed).
- **AI не работает** — добавьте ключ Gemini/OpenAI в env Vercel и redeploy.

## 6. Безопасность

- Не коммитьте `.env.local`. Шаблон: `.env.example`.
- На prod смените `INGEST_SECRET` и пароль админа; `ADMIN_PASSWORD` в Vercel можно убрать после создания админа, если не нужна автосинхронизация при входе.
