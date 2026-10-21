"use client";

import { useEffect, useId, useState, type ReactNode } from "react";

import { GridIcon, HelpIcon, PlusIcon, ShieldIcon } from "@/components/icons";

const STORAGE_KEY = "reelmind-onboarding-v1";
const OPEN_EVENT = "reelmind:onboarding";

type Step = {
  title: string;
  where: string;
  why: string;
  how: string;
  icon: ReactNode;
};

function stepsFor(isAdmin: boolean): Step[] {
  const steps: Step[] = [
    {
      title: "Каталог",
      where: "Главный экран и пункт «Каталог» внизу.",
      why: "Все сохранённые ссылки лежат здесь, а не в ленте соцсети.",
      how: "Листайте карточки или откройте раздел, чтобы сузить список.",
      icon: <GridIcon className="h-5 w-5" />,
    },
    {
      title: "Поиск",
      where: "Поле над сеткой карточек.",
      why: "Найти ссылку по слову или по смыслу, даже если точной фразы нет в названии.",
      how: "Введите запрос и Enter. Gemini ищет синонимы и близкие темы в описании и тегах.",
      icon: (
        <span className="font-display text-sm font-semibold" aria-hidden>
          ⌕
        </span>
      ),
    },
    {
      title: "Разделы",
      where: "Слева на компьютере, чипами сверху на телефоне.",
      why: "Здоровье, обучение и остальные темы не смешиваются.",
      how: "Нажмите «Здоровье» — увидите только связанные с ним ссылки.",
      icon: (
        <span className="inline-flex h-5 w-5 items-center justify-center text-sm" aria-hidden>
          💚
        </span>
      ),
    },
    {
      title: "Добавить ссылку",
      where: "Синяя кнопка «Добавить» и плюс в шапке на телефоне.",
      why: "Так ссылка попадает в ваш архив с превью и категорией.",
      how: "Android: Поделиться в Instagram → ReelMind. iPhone: Поделиться → Скопировать ссылку → ReelMind → «Вставить из буфера» (PWA в меню Instagram на iOS не бывает — ограничение Apple).",
      icon: <PlusIcon className="h-5 w-5" />,
    },
    {
      title: "Карточка",
      where: "Любая плитка в каталоге.",
      why: "Там превью с источника, описание и смена раздела, если ИИ ошибся.",
      how: "Откройте карточку → «Открыть источник» или выберите другую категорию.",
      icon: (
        <span className="font-display text-xs font-semibold" aria-hidden>
          Aa
        </span>
      ),
    },
  ];

  if (isAdmin) {
    steps.push({
      title: "Админ",
      where: "Кнопка с щитом внизу на телефоне и «Админка» в боковом меню.",
      why: "Пользователи, статистика и системные настройки — только для администратора.",
      how: "Нажмите рамку «Админ», откройте нужную вкладку и сохраните изменения.",
      icon: <ShieldIcon className="h-5 w-5" />,
    });
  }

  return steps;
}

export function OnboardingTrigger() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}
      className="focus-ring inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-sm)] border border-line text-ink-muted hover:bg-accent-soft hover:text-ink"
      aria-label="Как пользоваться ReelMind"
    >
      <HelpIcon className="h-5 w-5" />
    </button>
  );
}

export function Onboarding({ isAdmin = false }: { isAdmin?: boolean }) {
  const titleId = useId();
  const steps = stepsFor(isAdmin);
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, "done");
    } catch {
      // ignore
    }
  }

  function finish() {
    persist();
    setOpen(false);
    setIndex(0);
  }

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setOpen(true);
    } catch {
      setOpen(true);
    }

    const onOpen = () => {
      setIndex(0);
      setOpen(true);
    };
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") finish();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  const step = steps[index];
  if (!step) return null;
  const last = index === steps.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="card-surface w-full max-w-md rounded-[var(--radius-lg)] p-5 shadow-[var(--shadow)] lg:p-6"
      >
        <p className="text-xs text-ink-faint">
          {index + 1} из {steps.length}
        </p>
        <div className="mt-3 flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] border border-line text-accent">
            {step.icon}
          </span>
          <h2 id={titleId} className="font-display text-xl font-semibold tracking-tight text-ink">
            {step.title}
          </h2>
        </div>
        <dl className="mt-4 space-y-3 text-sm leading-relaxed">
          <div>
            <dt className="font-medium text-ink">Где</dt>
            <dd className="text-ink-muted">{step.where}</dd>
          </div>
          <div>
            <dt className="font-medium text-ink">Зачем</dt>
            <dd className="text-ink-muted">{step.why}</dd>
          </div>
          <div>
            <dt className="font-medium text-ink">Как</dt>
            <dd className="text-ink-muted">{step.how}</dd>
          </div>
        </dl>
        <div className="mt-6 flex gap-2">
          {index > 0 ? (
            <button
              type="button"
              onClick={() => setIndex((value) => value - 1)}
              className="focus-ring inline-flex min-h-11 flex-1 items-center justify-center rounded-[var(--radius-md)] border border-line px-4 text-sm font-medium text-ink"
            >
              Назад
            </button>
          ) : (
            <button
              type="button"
              onClick={finish}
              className="focus-ring inline-flex min-h-11 flex-1 items-center justify-center rounded-[var(--radius-md)] border border-line px-4 text-sm font-medium text-ink"
            >
              Пропустить
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (last) finish();
              else setIndex((value) => value + 1);
            }}
            className="btn-primary focus-ring inline-flex min-h-11 flex-1 items-center justify-center rounded-[var(--radius-md)] px-4 text-sm font-semibold"
          >
            {last ? "Понятно" : "Далее"}
          </button>
        </div>
      </div>
    </div>
  );
}
