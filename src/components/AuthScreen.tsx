import Link from "next/link";

import { AuthForm } from "@/components/AuthForm";
import { BookmarkMark } from "@/components/icons";
import { ThemeToggle } from "@/components/ThemeToggle";

type Props = {
  mode: "login" | "register";
  nextPath: string;
};

export function AuthScreen({ mode, nextPath }: Props) {
  const isLogin = mode === "login";

  return (
    <div className="grid min-h-dvh grid-cols-1 content-start md:h-dvh md:content-stretch md:grid-cols-[minmax(16rem,0.42fr)_minmax(20rem,0.58fr)] lg:grid-cols-[minmax(18rem,0.45fr)_minmax(22rem,0.55fr)]">
      <aside className="flex flex-col border-b border-line bg-surface/80 px-5 py-6 [padding-top:max(1.5rem,env(safe-area-inset-top))] md:h-full md:border-b-0 md:border-r md:px-10 md:py-10 lg:px-12 lg:py-12">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <BookmarkMark className="h-9 w-9 text-accent md:h-10 md:w-10" />
            <span className="font-display text-lg font-semibold tracking-tight text-ink md:text-xl">
              ReelMind
            </span>
          </div>
          <div className="md:hidden">
            <ThemeToggle />
          </div>
        </div>

        <div className="mt-6 max-w-[22rem] md:mt-0 md:flex md:flex-1 md:flex-col md:justify-center md:pt-8">
          <p className="font-display text-[1.35rem] font-semibold leading-snug tracking-tight text-ink md:text-[2rem] md:leading-tight">
            Ссылки с разных площадок — в одном каталоге по смыслу.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted md:mt-4">
            Сохраняйте Instagram, YouTube, статьи и любые URL. Категория подбирается
            автоматически, карточки видны только вам.
          </p>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 md:mt-auto">
          <p className="text-xs text-ink-faint">Личный архив. Без общей ленты.</p>
          <div className="hidden md:block">
            <ThemeToggle />
          </div>
        </div>
      </aside>

      <main className="flex flex-col justify-start bg-paper px-5 py-8 [padding-bottom:max(2rem,env(safe-area-inset-bottom))] md:h-full md:justify-center md:overflow-y-auto md:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-[440px]">
          <h1 className="font-display text-[1.7rem] font-semibold tracking-tight text-ink lg:text-[2rem]">
            {isLogin ? "Вход" : "Регистрация"}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            {isLogin
              ? "Откройте свой каталог сохранений."
              : "Создайте аккаунт — чужие закладки сюда не попадут."}
          </p>
          <div className="card-surface mt-6 rounded-[var(--radius-lg)] p-5 lg:mt-7 lg:p-7">
            <AuthForm mode={mode} nextPath={nextPath} />
          </div>
          <p className="mt-5 text-sm text-ink-muted">
            {isLogin ? "Ещё нет аккаунта? " : "Уже есть аккаунт? "}
            <Link
              href={
                isLogin
                  ? `/register?next=${encodeURIComponent(nextPath)}`
                  : `/login?next=${encodeURIComponent(nextPath)}`
              }
              className="focus-ring rounded-sm font-medium text-accent hover:underline"
            >
              {isLogin ? "Зарегистрироваться" : "Войти"}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
