import { z } from "zod";

import { ACTIVITIES, USER_ROLES } from "./constants";

const activityEnum = z.enum(
  ACTIVITIES as unknown as [string, ...string[]],
  { error: "Selecione uma atividade" },
);

const roleEnum = z.enum(USER_ROLES, { error: "Selecione um perfil" });

export const loginSchema = z.object({
  email: z.string().email("Informe um e-mail válido"),
  password: z.string().min(1, "Informe a senha"),
});

export const createUserSchema = z.object({
  name: z.string().min(1, "Informe o nome"),
  email: z.string().email("Informe um e-mail válido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  role: roleEnum,
  active: z.boolean().optional(),
  teamId: z.string().nullable().optional(),
  modules: z.array(z.string()).optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1, "Informe o nome"),
  email: z.string().email("Informe um e-mail válido"),
  password: z
    .union([
      z.literal(""),
      z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
    ])
    .optional(),
  role: roleEnum,
  active: z.boolean().optional(),
  teamId: z.string().nullable().optional(),
  modules: z.array(z.string()).optional(),
});

export const teamSchema = z.object({
  name: z.string().min(1, "Informe o nome da equipe"),
  active: z.boolean().optional(),
});

export type TeamFormData = z.infer<typeof teamSchema>;

export const userSchema = createUserSchema;

export const timeEntrySchema = z.object({
  task: z.string().min(1, "Informe a tarefa"),
  userId: z.string().min(1, "Selecione o usuário"),
  date: z.string().min(1, "Informe a data"),
  hours: z
    .number({ error: "Informe as horas" })
    .positive("As horas devem ser maiores que zero")
    .max(24, "As horas não podem ser maiores que 24"),
  comment: z.string().optional(),
  activity: activityEnum,
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type CreateUserFormData = z.infer<typeof createUserSchema>;
export type UpdateUserFormData = z.infer<typeof updateUserSchema>;
export type UserFormData = CreateUserFormData | UpdateUserFormData;
export type TimeEntryFormData = z.infer<typeof timeEntrySchema>;

export const updateProfileSchema = z.object({
  name: z.string().min(1, "Informe o nome"),
  email: z.string().email("Informe um e-mail válido"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe a senha atual"),
    newPassword: z
      .string()
      .min(8, "A nova senha deve ter pelo menos 8 caracteres"),
    confirmPassword: z.string().min(1, "Confirme a nova senha"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "A nova senha deve ser diferente da senha atual",
    path: ["newPassword"],
  });

export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

const goalHours = (max: number, message: string) =>
  z
    .number({ error: "Informe um valor válido" })
    .min(0, "O valor não pode ser negativo")
    .max(max, message);

export const userGoalsSchema = z.object({
  dailyGoalHours: goalHours(24, "A meta diária não pode ser maior que 24h"),
  weeklyGoalHours: goalHours(168, "A meta semanal não pode ser maior que 168h"),
  monthlyGoalHours: goalHours(744, "A meta mensal não pode ser maior que 744h"),
  timerRoundingMinutes: z
    .number({ error: "Selecione uma opção" })
    .int()
    .min(0)
    .max(60),
});

export type UserGoalsFormData = z.infer<typeof userGoalsSchema>;

export const timerStartSchema = z.object({
  task: z.string().min(1, "Informe a tarefa"),
  activity: activityEnum,
  comment: z.string().optional(),
});

export const timerStopSchema = z.object({
  task: z.string().min(1, "Informe a tarefa"),
  activity: activityEnum,
  comment: z.string().optional(),
  hours: z
    .number({ error: "Informe as horas" })
    .positive("As horas devem ser maiores que zero")
    .max(24, "As horas não podem ser maiores que 24"),
});

export type TimerStartFormData = z.infer<typeof timerStartSchema>;
export type TimerStopFormData = z.infer<typeof timerStopSchema>;
