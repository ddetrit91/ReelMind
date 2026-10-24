# Task — текущий статус и очередь

**Обновлять** при завершении задач или смене приоритетов. Агент: сверяться с этим файлом и [MEMORY.md](./MEMORY.md).

## Статус MVP фазы 1

| Задача | Статус |
|--------|--------|
| Next.js + Drizzle + SQLite + seed | ✅ готово |
| API ingest / items / categories | ✅ готово |
| PWA manifest + `/share` | ✅ готово |
| UI `/`, `/add`, `/items/[id]` | ✅ готово |
| README + Context (PLAN, MEMORY, DEPLOY) | ✅ готово |
| `.cursor/MEMORY.md` + `.cursor/TASK.md` | ✅ готово |

**Фаза 1 считается реализованной.** Локальный запуск: `npm run dev`.

## Сейчас в работе

_Нет активных задач — укажите следующую цель пользователя._

## Очередь (фаза 2 и улучшения)

- [ ] Деплой Vercel + Turso — чеклист [Context/DEPLOY.md](../Context/DEPLOY.md)
- [ ] Auth (Google / magic link) + `user_id` на items
- [ ] Спросить пользователя про **светлую/тёмную тему** (правило `ask-light-dark-theme.mdc`) — тема пока `prefers-color-scheme`
- [ ] Pull-to-refresh или кнопка «Обновить» на главной (в плане polish)
- [ ] Skeletons при загрузке (polish)
- [ ] `META_OEMBED_ACCESS_TOKEN` для превью Instagram
- [ ] Memo-level: транскрипт, полноп текстовый поиск

## Быстрая проверка после изменений

1. `npm run build`
2. Открыть `/` — demo-карточки после `npm run db:seed`
3. `/add` — сохранить тестовый URL Instagram + текст
4. PATCH категории на `/items/[id]`

## Для пользователя

- Добавить `OPENAI_API_KEY` или `ANTHROPIC_API_KEY` в `.env.local` для нормальной классификации.
- Share с телефона — нужен HTTPS (tunnel) или используйте `/add`.
