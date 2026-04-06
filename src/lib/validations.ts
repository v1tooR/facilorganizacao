/**
 * lib/validations.ts
 *
 * Schemas Zod para validação de dados de entrada.
 * Centralizados aqui para reutilização entre Route Handlers e Server Actions.
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
      .max(72, "Senha muito longa.") // bcrypt processa no máximo 72 bytes
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
  dueDate: z.string().datetime().optional(),
  projectId: z.string().cuid().optional(),
  categoryId: z.string().cuid().optional(),
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;

// ─── Finance ──────────────────────────────────────────────────────────────

export const CreateFinanceEntrySchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  title: z.string().min(1, "Título é obrigatório.").max(255).trim(),
  description: z.string().max(5000).optional(),
  // amount como string para evitar perda de precisão na transmissão JSON
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Valor inválido. Use formato: 1234.56")
    .refine((v) => parseFloat(v) > 0, "Valor deve ser maior que zero."),
  occurredAt: z.string().datetime(),
  categoryId: z.string().cuid().optional(),
});

export type CreateFinanceEntryInput = z.infer<typeof CreateFinanceEntrySchema>;

// ─── Notes ────────────────────────────────────────────────────────────────

export const CreateNoteSchema = z.object({
  title: z.string().min(1, "Título é obrigatório.").max(255).trim(),
  content: z.string().min(1, "Conteúdo é obrigatório.").max(50000),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{3,6}$/, "Cor deve ser um código hex válido.")
    .optional(),
});

export type CreateNoteInput = z.infer<typeof CreateNoteSchema>;
