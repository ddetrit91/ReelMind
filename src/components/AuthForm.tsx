"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { loginAction, registerAction } from "@/lib/auth/actions";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary focus-ring inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-md)] px-4 py-3 text-sm font-semibold disabled:opacity-60"
    >
      {pending ? "Подождите…" : label}
    </button>
  );
}

type Props = {
  mode: "login" | "register";
  nextPath: string;
};

export function AuthForm({ mode, nextPath }: Props) {
  const action = mode === "login" ? loginAction : registerAction;
  const [state, formAction] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={nextPath} />
      {mode === "register" ? (
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-ink">Имя</span>
          <input
            name="name"
            type="text"
            required
            autoComplete="name"
            minLength={2}
            className="focus-ring min-h-11 rounded-[var(--radius-sm)] border border-line bg-paper px-3 py-2 text-base text-ink"
          />
        </label>
      ) : null}
      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium text-ink">Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="focus-ring min-h-11 rounded-[var(--radius-sm)] border border-line bg-paper px-3 py-2 text-base text-ink"
        />
      </label>
      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium text-ink">Пароль</span>
        <input
          name="password"
          type="password"
          required
          minLength={mode === "register" ? 8 : undefined}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          className="focus-ring min-h-11 rounded-[var(--radius-sm)] border border-line bg-paper px-3 py-2 text-base text-ink"
        />
        {mode === "register" ? (
          <span className="text-xs text-ink-muted">Не меньше 8 символов</span>
        ) : null}
      </label>
      {state?.error ? (
        <p className="rounded-[var(--radius-sm)] bg-accent-soft px-3 py-2 text-sm text-ink" role="alert">
          {state.error}
        </p>
      ) : null}
      <SubmitButton label={mode === "login" ? "Войти" : "Создать аккаунт"} />
    </form>
  );
}
