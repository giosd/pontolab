import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ForbiddenPage() {
  await requireAuth();

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="max-w-lg text-center">
        <PageHeader
          title="Acesso negado"
          description="Você não tem permissão para acessar este módulo. Entre em contato com um administrador se precisar de acesso."
        />
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/dashboard">
            <Button type="button">Ir para o dashboard</Button>
          </Link>
          <Link href="/perfil">
            <Button type="button" variant="secondary">
              Meu perfil
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
