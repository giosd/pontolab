// Helpers puros do fluxo de criação/edição de usuário (sem dependências internas,
// para serem facilmente testáveis).

export type UserFormMode = "create" | "edit";

/** Só atualiza a senha quando uma nova senha não-vazia for informada. */
export function shouldUpdatePassword(password?: string | null): boolean {
  return typeof password === "string" && password.trim().length > 0;
}

/**
 * Resolve a equipe ao atualizar um usuário, preservando a equipe atual quando
 * o admin não enviar o campo. Gestor fica sempre preso à própria equipe.
 */
export function resolveUpdateTeamId(options: {
  editorRole: string;
  editorTeamId: string | null;
  requestedTeamId: string | null | undefined;
  targetTeamId: string | null;
}): string | null {
  const { editorRole, editorTeamId, requestedTeamId, targetTeamId } = options;

  if (editorRole === "GESTOR") {
    return editorTeamId ?? null;
  }

  // Admin: usa o valor enviado; se ausente (undefined), preserva o atual.
  return requestedTeamId !== undefined ? requestedTeamId : targetTeamId;
}

/** Mapeia o modo do formulário para a operação de backend. */
export function actionForMode(mode: UserFormMode): "create" | "update" {
  return mode === "edit" ? "update" : "create";
}
