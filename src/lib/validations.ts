/**
 * lib/validations.ts
 *
 * Schemas Zod para validação de dados de entrada.
 * Centralizados aqui para reutilização entre Route Handlers.
 */

import { z } from "zod";

// ─── Auth ─────────────────────────────────────────────────────────────────

export const RegisterSchema = z
  .object({
    name: z
      .string({ error: "Nome é obrigatório." })
      .min(2, "Nome deve ter pelo menos 2 caracteres.")
      .max(120, "Nome muito longo.")
      .trim(),

    email: z
      .email("E-mail inválido.")
      .max(255, "E-mail muito longo.")
      .toLowerCase()
      .trim(),

    password: z
      .string({ error: "Senha é obrigatória." })
      .min(8, "Senha deve ter pelo menos 8 caracteres.")
      .max(72, "Senha muito longa.")
      .regex(/[A-Za-z]/, "Senha deve conter pelo menos uma letra.")
      .regex(/\d/, "Senha deve conter pelo menos um número."),

    confirmPassword: z.string({ error: "Confirmação de senha é obrigatória." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.email("E-mail inválido.").toLowerCase().trim(),
  password: z.string({ error: "Senha é obrigatória." }).min(1, "Informe a senha."),
});

export type LoginInput = z.infer<typeof LoginSchema>;

// ─── Tasks ────────────────────────────────────────────────────────────────

export const CreateTaskSchema = z.object({
  title: z.string().min(1, "Título é obrigatório.").max(255).trim(),
  description: z.string().max(5000).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  dueDate: z.string().datetime({ offset: true }).optional().or(z.literal("")).transform((v) => v === "" ? undefined : v),
  projectId: z.string().cuid().optional().or(z.literal("")).transform((v) => v === "" ? undefined : v),
  categoryId: z.string().cuid().optional().or(z.literal("")).transform((v) => v === "" ? undefined : v),
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;

export const UpdateTaskSchema = z.object({
  title: z.string().min(1, "Título é obrigatório.").max(255).trim().optional(),
  description: z.string().max(5000).optional(),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  dueDate: z.string().datetime({ offset: true }).optional().or(z.literal("")).transform((v) => v === "" ? undefined : v),
  projectId: z.union([z.string().cuid(), z.literal(""), z.null()]).optional()
    .transform((v) => v === "" ? undefined : v),
  categoryId: z.string().cuid().optional().or(z.literal("")).transform((v) => v === "" ? undefined : v),
});

export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;

// ─── Projects ─────────────────────────────────────────────────────────────

export const CreateProjectSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório.").max(255).trim(),
  description: z.string().max(5000).optional(),
  status: z.enum(["PLANNING", "IN_PROGRESS", "COMPLETED", "ON_HOLD", "CANCELLED"]).default("PLANNING"),
  progress: z.number().int().min(0).max(100).default(0),
  startDate: z.string().datetime({ offset: true }).optional().or(z.literal("")).transform((v) => v === "" ? undefined : v),
  dueDate: z.string().datetime({ offset: true }).optional().or(z.literal("")).transform((v) => v === "" ? undefined : v),
});

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;

export const UpdateProjectSchema = z.object({
  name: z.string().min(1).max(255).trim().optional(),
  description: z.string().max(5000).optional(),
  status: z.enum(["PLANNING", "IN_PROGRESS", "COMPLETED", "ON_HOLD", "CANCELLED"]).optional(),
  progress: z.number().int().min(0).max(100).optional(),
  startDate: z.union([z.string().datetime({ offset: true }), z.literal(""), z.null()]).optional()
    .transform((v) => v === "" ? undefined : v),
  dueDate: z.union([z.string().datetime({ offset: true }), z.literal(""), z.null()]).optional()
    .transform((v) => v === "" ? undefined : v),
});

export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;

// ─── Notes ────────────────────────────────────────────────────────────────

const noteColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{3,6}$/, "Cor deve ser um código hex válido.")
  .optional()
  .or(z.literal(""))
  .transform((v) => (v === "" ? undefined : v));

const noteTagsSchema = z
  .array(z.string().min(1).max(50).trim())
  .max(10, "Máximo de 10 tags.")
  .default([]);

export const CreateNoteSchema = z.object({
  title: z.string().min(1, "Título é obrigatório.").max(255).trim(),
  content: z.string().max(50000).default(""),
  color: noteColorSchema,
  tags: noteTagsSchema,
  isPinned: z.boolean().default(false),
  projectId: z
    .string()
    .cuid()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),
});

export type CreateNoteInput = z.infer<typeof CreateNoteSchema>;

export const UpdateNoteSchema = z.object({
  title: z.string().min(1).max(255).trim().optional(),
  content: z.string().max(50000).optional(),
  color: noteColorSchema,
  tags: z.array(z.string().min(1).max(50).trim()).max(10).optional(),
  isPinned: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  projectId: z
    .union([z.string().cuid(), z.literal(""), z.null()])
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
});

export type UpdateNoteInput = z.infer<typeof UpdateNoteSchema>;

// ─── Finance ──────────────────────────────────────────────────────────────

export const CreateFinanceEntrySchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  title: z.string().min(1, "Título é obrigatório.").max(255).trim(),
  description: z.string().max(5000).optional(),
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Valor inválido. Use formato: 1234.56")
    .refine((v) => parseFloat(v) > 0, "Valor deve ser maior que zero."),
  occurredAt: z.string().datetime({ offset: true }),
  categoryId: z.string().cuid().optional().or(z.literal("")).transform((v) => v === "" ? undefined : v),
  status: z.enum(["CONFIRMED", "PREDICTED", "OVERDUE"]).default("CONFIRMED"),
  recurrence: z.enum(["NONE", "WEEKLY", "MONTHLY", "ANNUAL"]).default("NONE"),
});

export type CreateFinanceEntryInput = z.infer<typeof CreateFinanceEntrySchema>;

export const UpdateFinanceEntrySchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]).optional(),
  title: z.string().min(1).max(255).trim().optional(),
  description: z.string().max(5000).optional(),
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/)
    .refine((v) => parseFloat(v) > 0)
    .optional(),
  occurredAt: z.string().datetime({ offset: true }).optional(),
  categoryId: z.string().cuid().optional().or(z.literal("")).transform((v) => v === "" ? undefined : v),
  status: z.enum(["CONFIRMED", "PREDICTED", "OVERDUE"]).optional(),
  recurrence: z.enum(["NONE", "WEEKLY", "MONTHLY", "ANNUAL"]).optional(),
});

export type UpdateFinanceEntryInput = z.infer<typeof UpdateFinanceEntrySchema>;

// ─── Categories ───────────────────────────────────────────────────────────

export const CreateCategorySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório.").max(100).trim(),
  scope: z.enum(["TASK", "FINANCE", "GENERAL"]).default("GENERAL"),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{3,6}$/, "Cor deve ser um código hex válido.")
    .optional(),
});

export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;

// ─── User ─────────────────────────────────────────────────────────────────

export const UpdateProfileSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres.").max(120).trim().optional(),
  email: z.email("E-mail inválido.").max(255).toLowerCase().trim().optional(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

export const UpdatePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe a senha atual."),
    newPassword: z
      .string()
      .min(8, "Nova senha deve ter pelo menos 8 caracteres.")
      .max(72)
      .regex(/[A-Za-z]/, "Senha deve conter pelo menos uma letra.")
      .regex(/\d/, "Senha deve conter pelo menos um número."),
    confirmNewPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmNewPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmNewPassword"],
  });

export type UpdatePasswordInput = z.infer<typeof UpdatePasswordSchema>;
