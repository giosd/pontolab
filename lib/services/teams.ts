import { canManageTeam } from "@/lib/access-scope";
import type { SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { teamSchema, type TeamFormData } from "@/lib/validations";
import type { Team } from "@/types";

import { ScopeError } from "@/lib/services/users";

const teamSelect = {
  id: true,
  name: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} as const;

function assertAdminManageTeam(session: SessionUser, teamId?: string) {
  if (!canManageTeam(session, teamId)) {
    throw new ScopeError("Apenas administradores gerenciam equipes.");
  }
}

export async function getTeams(): Promise<Team[]> {
  const teams = await prisma.team.findMany({
    select: {
      ...teamSelect,
      users: { select: { role: true } },
    },
    orderBy: { name: "asc" },
  });

  return teams.map((team) => ({
    id: team.id,
    name: team.name,
    active: team.active,
    createdAt: team.createdAt,
    updatedAt: team.updatedAt,
    userCount: team.users.length,
    managerCount: team.users.filter((user) => user.role === "GESTOR").length,
  }));
}

export async function getActiveTeams(): Promise<Team[]> {
  const teams = await prisma.team.findMany({
    where: { active: true },
    select: teamSelect,
    orderBy: { name: "asc" },
  });

  return teams.map((team) => ({
    id: team.id,
    name: team.name,
    active: team.active,
    createdAt: team.createdAt,
    updatedAt: team.updatedAt,
  }));
}

export async function getTeamMembers(teamId: string) {
  return prisma.user.findMany({
    where: { teamId },
    select: { id: true, name: true, email: true, role: true, active: true },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });
}

export async function createTeam(
  data: TeamFormData,
  session: SessionUser,
): Promise<Team> {
  assertAdminManageTeam(session);
  const parsed = teamSchema.parse(data);

  const team = await prisma.team.create({
    data: {
      name: parsed.name.trim(),
      active: parsed.active ?? true,
      createdById: session.userId,
    },
    select: teamSelect,
  });

  return {
    id: team.id,
    name: team.name,
    active: team.active,
    createdAt: team.createdAt,
    updatedAt: team.updatedAt,
  };
}

export async function updateTeam(
  id: string,
  data: TeamFormData,
  session: SessionUser,
): Promise<Team> {
  assertAdminManageTeam(session, id);
  const parsed = teamSchema.parse(data);

  const team = await prisma.team.update({
    where: { id },
    data: {
      name: parsed.name.trim(),
      ...(parsed.active !== undefined ? { active: parsed.active } : {}),
    },
    select: teamSelect,
  });

  return {
    id: team.id,
    name: team.name,
    active: team.active,
    createdAt: team.createdAt,
    updatedAt: team.updatedAt,
  };
}

export async function deactivateTeam(
  id: string,
  session: SessionUser,
): Promise<Team> {
  assertAdminManageTeam(session, id);

  const team = await prisma.team.update({
    where: { id },
    data: { active: false },
    select: teamSelect,
  });

  return {
    id: team.id,
    name: team.name,
    active: team.active,
    createdAt: team.createdAt,
    updatedAt: team.updatedAt,
  };
}
