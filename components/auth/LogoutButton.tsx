import { logoutAction } from "@/lib/actions/auth";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[var(--app-text)] transition-colors hover:bg-[var(--app-card-secondary)]"
      >
        Sair
      </button>
    </form>
  );
}
