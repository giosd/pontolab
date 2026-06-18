"use client";

import { useActionState } from "react";

import { loginAction } from "@/lib/actions/auth";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { APP_NAME } from "@/lib/constants";

const initialState = { error: "" };

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <Card className="w-full max-w-md">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold text-[#1E5F7A]">{APP_NAME}</h1>
        <p className="mt-1 text-sm text-[#38A8D8]">Acesse sua conta para continuar</p>
      </div>

      <form action={formAction} className="space-y-4">
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={isPending}
        />

        <Input
          label="Senha"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={isPending}
        />

        {state.error ? (
          <p className="text-sm text-red-600">{state.error}</p>
        ) : null}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </Card>
  );
}
