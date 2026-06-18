"use client";

import type { ImportUserMode } from "@/types/import";
import type { User } from "@/types";

interface ImportUserDestinationProps {
  userMode: ImportUserMode;
  selectedUserId: string;
  users: User[];
  isAdmin: boolean;
  currentUserId: string;
  currentUserName: string;
  onUserModeChange: (mode: ImportUserMode) => void;
  onSelectedUserChange: (userId: string) => void;
}

const MODE_LABELS: Record<ImportUserMode, string> = {
  logged_in: "Importar para o usuário logado",
  selected: "Selecionar usuário do sistema",
  from_file: "Usar usuário informado no arquivo",
};

export function ImportUserDestination({
  userMode,
  selectedUserId,
  users,
  isAdmin,
  currentUserId,
  currentUserName,
  onUserModeChange,
  onSelectedUserChange,
}: ImportUserDestinationProps) {
  const availableModes: ImportUserMode[] = isAdmin
    ? ["selected", "logged_in", "from_file"]
    : ["logged_in"];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-[#1E5F7A]">
          Destino dos registros
        </h3>
        <p className="mt-1 text-sm text-[#38A8D8]">
          Defina para qual usuário os apontamentos serão importados.
        </p>
      </div>

      <div className="space-y-3">
        {availableModes.map((mode) => (
          <label
            key={mode}
            className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#D9EEF9] bg-[#F5FBFF] px-4 py-3"
          >
            <input
              type="radio"
              name="import-user-mode"
              value={mode}
              checked={userMode === mode}
              onChange={() => onUserModeChange(mode)}
              className="mt-1 h-4 w-4 border-[#D9EEF9] text-[#4EA8DE]"
            />
            <span className="text-sm text-[#1E5F7A]">
              {mode === "logged_in"
                ? `${MODE_LABELS.logged_in} (${currentUserName})`
                : MODE_LABELS[mode]}
            </span>
          </label>
        ))}
      </div>

      {isAdmin && userMode === "selected" ? (
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-[#1E5F7A]">
            Usuário de destino *
          </span>
          <select
            value={selectedUserId}
            onChange={(event) => onSelectedUserChange(event.target.value)}
            className="rounded-xl border border-[#D9EEF9] bg-white px-3 py-2 text-sm text-[#1E5F7A] outline-none focus:border-[#4EA8DE] focus:ring-2 focus:ring-[#89CFF0]/40"
          >
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
                {user.id === currentUserId ? " (você)" : ""}
              </option>
            ))}
          </select>
        </label>
      ) : null}
    </div>
  );
}
