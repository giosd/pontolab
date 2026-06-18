import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 10);

  await prisma.user.upsert({
    where: { email: "admin@pontolab.local" },
    update: {
      name: "Admin",
      passwordHash,
      role: "ADMIN",
      active: true,
    },
    create: {
      name: "Admin",
      email: "admin@pontolab.local",
      passwordHash,
      role: "ADMIN",
      active: true,
    },
  });

  // Equipe padrão para usuários existentes (SPEC 13).
  let defaultTeam = await prisma.team.findFirst({
    where: { name: "Equipe Principal" },
    select: { id: true },
  });

  if (!defaultTeam) {
    defaultTeam = await prisma.team.create({
      data: { name: "Equipe Principal" },
      select: { id: true },
    });
  }

  // Atribui usuários não-admin sem equipe à Equipe Principal.
  await prisma.user.updateMany({
    where: { teamId: null, role: { not: "ADMIN" } },
    data: { teamId: defaultTeam.id },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
