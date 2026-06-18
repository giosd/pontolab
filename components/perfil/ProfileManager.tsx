"use client";

import { useState } from "react";

import { ChangePasswordForm } from "@/components/perfil/ChangePasswordForm";
import { ProfileForm } from "@/components/perfil/ProfileForm";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatDateBR } from "@/lib/dates";
import type { SafeUser } from "@/types";

interface ProfileManagerProps {
  profile: SafeUser;
}

export function ProfileManager({ profile }: ProfileManagerProps) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSuccess = (message: string) => {
    setSuccessMessage(message);
  };

  return (
    <>
      <PageHeader
        title="Perfil"
        description="Gerencie seus dados pessoais e segurança da conta."
      />

      {successMessage ? (
        <div className="mb-6 rounded-2xl border border-[#D6EEF8] bg-[#F0F8FF] px-4 py-3 text-sm text-[#1E5F7A]">
          {successMessage}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-base font-medium text-[#1E5F7A]">
            Informações da conta
          </h2>

          <dl className="mb-6 space-y-3 text-sm">
            <div className="flex justify-between gap-4 border-b border-[#D6EEF8] pb-3">
              <dt className="text-[#38A8D8]">Perfil</dt>
              <dd className="text-[#1E5F7A]">
                {profile.role === "ADMIN" ? "Administrador" : "Usuário"}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-[#D6EEF8] pb-3">
              <dt className="text-[#38A8D8]">Status</dt>
              <dd className="text-[#1E5F7A]">
                {profile.active ? "Ativo" : "Inativo"}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-[#D6EEF8] pb-3">
              <dt className="text-[#38A8D8]">Cadastro</dt>
              <dd className="text-[#1E5F7A]">
                {formatDateBR(profile.createdAt)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#38A8D8]">Último login</dt>
              <dd className="text-[#1E5F7A]">
                {profile.lastLoginAt
                  ? formatDateBR(profile.lastLoginAt)
                  : "—"}
              </dd>
            </div>
          </dl>

          <h3 className="mb-4 text-sm font-medium text-[#1E5F7A]">
            Editar dados
          </h3>
          <ProfileForm profile={profile} onSuccess={handleSuccess} />
        </Card>

        <Card>
          <h2 className="mb-4 text-base font-medium text-[#1E5F7A]">
            Trocar senha
          </h2>
          <p className="mb-4 text-sm text-[#38A8D8]">
            Use pelo menos 8 caracteres. Após a troca, outras sessões serão
            encerradas automaticamente.
          </p>
          <ChangePasswordForm onSuccess={handleSuccess} />
        </Card>
      </div>
    </>
  );
}
