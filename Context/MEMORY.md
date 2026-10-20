# Память проекта

## 2026-10-19 — Старт MVP (фаза 1)

- **Local-first:** БД — SQLite `local.db`, тот же Drizzle-клиент потом для Turso.
- **Instagram:** метаданные нестабильны; для AI опираемся на `share_text` + ручной текст на `/add`.
- **Share target:** GET `/share?url=&text=`; на dev основной путь — `/add`, share с телефона через HTTPS/tunnel.
- **Auth:** нет в MVP; POST ingest защищён `INGEST_SECRET` (Server Actions обходят API).
- **Классификация:** один LLM-вызов → slug из seed-категорий; без ключа — keyword fallback.

## 2026-10-19 — Фаза 1 реализована

- MVP в корне репозитория (Next.js). Память и задачи для агента: `.cursor/MEMORY.md`, `.cursor/TASK.md`.
- Сборка: `npm run build` OK; страницы с БД используют `export const instant = false`.
