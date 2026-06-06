-- Backup SQL - Organizacao Facil
-- Gerado em: 2026-06-06T03:54:31.922Z
-- Origem: DATABASE_URL/DIRECT_URL do ambiente local
-- Restaurar em um banco PostgreSQL vazio.

BEGIN;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

-- Schema
-- CreateEnum
CREATE TYPE "UserPlan" AS ENUM ('FREE', 'PRO', 'BUSINESS');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('PLANNING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FinanceType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "FinanceStatus" AS ENUM ('CONFIRMED', 'PREDICTED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "FinanceRecurrence" AS ENUM ('NONE', 'WEEKLY', 'MONTHLY', 'ANNUAL');

-- CreateEnum
CREATE TYPE "CategoryScope" AS ENUM ('TASK', 'FINANCE', 'GENERAL');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "plan" "UserPlan" NOT NULL DEFAULT 'FREE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    "categoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'PLANNING',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "color" VARCHAR(30),
    "tags" TEXT,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "pinnedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "projectId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_entries" (
    "id" TEXT NOT NULL,
    "type" "FinanceType" NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT,
    "status" "FinanceStatus" NOT NULL DEFAULT 'CONFIRMED',
    "recurrence" "FinanceRecurrence" NOT NULL DEFAULT 'NONE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "scope" "CategoryScope" NOT NULL DEFAULT 'GENERAL',
    "color" VARCHAR(30),
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "tasks_userId_idx" ON "tasks"("userId");

-- CreateIndex
CREATE INDEX "tasks_userId_status_idx" ON "tasks"("userId", "status");

-- CreateIndex
CREATE INDEX "tasks_userId_dueDate_idx" ON "tasks"("userId", "dueDate");

-- CreateIndex
CREATE INDEX "tasks_projectId_idx" ON "tasks"("projectId");

-- CreateIndex
CREATE INDEX "projects_userId_idx" ON "projects"("userId");

-- CreateIndex
CREATE INDEX "projects_userId_status_idx" ON "projects"("userId", "status");

-- CreateIndex
CREATE INDEX "notes_userId_idx" ON "notes"("userId");

-- CreateIndex
CREATE INDEX "notes_userId_isPinned_idx" ON "notes"("userId", "isPinned");

-- CreateIndex
CREATE INDEX "notes_userId_isArchived_idx" ON "notes"("userId", "isArchived");

-- CreateIndex
CREATE INDEX "notes_projectId_idx" ON "notes"("projectId");

-- CreateIndex
CREATE INDEX "finance_entries_userId_idx" ON "finance_entries"("userId");

-- CreateIndex
CREATE INDEX "finance_entries_userId_type_idx" ON "finance_entries"("userId", "type");

-- CreateIndex
CREATE INDEX "finance_entries_userId_occurredAt_idx" ON "finance_entries"("userId", "occurredAt");

-- CreateIndex
CREATE INDEX "finance_entries_userId_status_idx" ON "finance_entries"("userId", "status");

-- CreateIndex
CREATE INDEX "categories_userId_idx" ON "categories"("userId");

-- CreateIndex
CREATE INDEX "categories_userId_scope_idx" ON "categories"("userId", "scope");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_entries" ADD CONSTRAINT "finance_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_entries" ADD CONSTRAINT "finance_entries_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Prisma migrations table
CREATE TABLE IF NOT EXISTS public."_prisma_migrations" (
  id VARCHAR(36) PRIMARY KEY,
  checksum VARCHAR(64) NOT NULL,
  finished_at TIMESTAMPTZ,
  migration_name VARCHAR(255) NOT NULL,
  logs TEXT,
  rolled_back_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  applied_steps_count INTEGER NOT NULL DEFAULT 0
);

-- Data
-- _prisma_migrations: 1 rows
INSERT INTO public."_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count") VALUES ('68b3d415-5018-4359-9e28-49887183d477', 'bdcabca8878a1f21a8c90f8f6b0ba12e11739bb0666af9f740efff183c206f03', '2026-05-28T01:50:47.646Z', '20260528015040_init', NULL, NULL, '2026-05-28T01:50:41.597Z', 1);

-- users: 1 rows
INSERT INTO public."users" ("id", "name", "email", "passwordHash", "plan", "createdAt", "updatedAt") VALUES ('cmno39nwj0000iovdp54gm3kr', 'Victor', 'dev@organizacaofacil.com.br', '$2b$12$HJXQCW5g8CdeENHEfOfsK.ChbFCKvPcICu9sYa6A1GQbFSlP.y5/i', 'PRO', '2026-04-07T06:58:01.796Z', '2026-04-07T07:28:54.610Z');

-- projects: 10 rows
INSERT INTO public."projects" ("id", "name", "description", "status", "progress", "startDate", "dueDate", "userId", "createdAt", "updatedAt") VALUES ('cmp4ym6er00006svd79rnoxin', 'Vale Azul - Lava Roupa', 'Landing Page', 'IN_PROGRESS', 0, '2026-05-12T18:00:00.000Z', '2026-05-17T18:00:00.000Z', 'cmno39nwj0000iovdp54gm3kr', '2026-05-14T06:59:34.900Z', '2026-05-14T06:59:34.900Z');
INSERT INTO public."projects" ("id", "name", "description", "status", "progress", "startDate", "dueDate", "userId", "createdAt", "updatedAt") VALUES ('cmp4ympi700016svd9mzt75g7', 'Fernanda Quieroga', 'Landing Page - Vinicius', 'IN_PROGRESS', 0, '2026-05-12T18:00:00.000Z', '2026-05-15T18:00:00.000Z', 'cmno39nwj0000iovdp54gm3kr', '2026-05-14T06:59:59.647Z', '2026-05-14T06:59:59.647Z');
INSERT INTO public."projects" ("id", "name", "description", "status", "progress", "startDate", "dueDate", "userId", "createdAt", "updatedAt") VALUES ('cmp4yn6o500026svd78lb2c9x', 'Alterações Claris Clinica', 'Alterações no Drive', 'IN_PROGRESS', 0, NULL, '2026-05-15T18:00:00.000Z', 'cmno39nwj0000iovdp54gm3kr', '2026-05-14T07:00:21.893Z', '2026-05-14T07:00:21.893Z');
INSERT INTO public."projects" ("id", "name", "description", "status", "progress", "startDate", "dueDate", "userId", "createdAt", "updatedAt") VALUES ('cmp4yo3qs00036svda37mwrv1', 'Blog da SB', 'Estrutura do Blog para SB', 'IN_PROGRESS', 0, NULL, '2026-05-18T18:00:00.000Z', 'cmno39nwj0000iovdp54gm3kr', '2026-05-14T07:01:04.756Z', '2026-05-14T07:01:04.756Z');
INSERT INTO public."projects" ("id", "name", "description", "status", "progress", "startDate", "dueDate", "userId", "createdAt", "updatedAt") VALUES ('cmp4yolgr00046svdm4m6yamv', 'Restaurante Premium - Campos do Jordão', 'Restaurante Premium - Campos do Jordão', 'PLANNING', 0, NULL, '2026-05-22T18:00:00.000Z', 'cmno39nwj0000iovdp54gm3kr', '2026-05-14T07:01:27.723Z', '2026-05-14T07:01:27.723Z');
INSERT INTO public."projects" ("id", "name", "description", "status", "progress", "startDate", "dueDate", "userId", "createdAt", "updatedAt") VALUES ('cmp4yp8k300056svdpxwl109a', 'iGod', 'Aplicativo Web nas Sextas feiras', 'PLANNING', 0, '2026-05-13T18:00:00.000Z', '2026-05-29T18:00:00.000Z', 'cmno39nwj0000iovdp54gm3kr', '2026-05-14T07:01:57.651Z', '2026-05-14T07:01:57.651Z');
INSERT INTO public."projects" ("id", "name", "description", "status", "progress", "startDate", "dueDate", "userId", "createdAt", "updatedAt") VALUES ('cmp4yqpc800066svd9o96m0o0', 'Diabetes no Alvo - Curso', 'Landing Page para Profissionais', 'ON_HOLD', 0, NULL, '2026-05-14T18:00:00.000Z', 'cmno39nwj0000iovdp54gm3kr', '2026-05-14T07:03:06.056Z', '2026-05-14T07:03:06.056Z');
INSERT INTO public."projects" ("id", "name", "description", "status", "progress", "startDate", "dueDate", "userId", "createdAt", "updatedAt") VALUES ('cmp4yrgjm00076svdj0rbnlef', 'Moriah - Clínica Estética', 'Landing Page com Blog', 'PLANNING', 0, NULL, '2026-05-29T18:00:00.000Z', 'cmno39nwj0000iovdp54gm3kr', '2026-05-14T07:03:41.314Z', '2026-05-14T07:03:41.314Z');
INSERT INTO public."projects" ("id", "name", "description", "status", "progress", "startDate", "dueDate", "userId", "createdAt", "updatedAt") VALUES ('cmp4ys0lx00086svdovv5gjdy', 'Finalização Octaverta', 'Finalização Octaverta', 'IN_PROGRESS', 0, NULL, '2026-05-18T18:00:00.000Z', 'cmno39nwj0000iovdp54gm3kr', '2026-05-14T07:04:07.317Z', '2026-05-14T07:04:07.317Z');
INSERT INTO public."projects" ("id", "name", "description", "status", "progress", "startDate", "dueDate", "userId", "createdAt", "updatedAt") VALUES ('cmp4yu61a00096svd3igdnlpx', 'Finalização de Rigal Engenharia', 'Landing Page', 'ON_HOLD', 0, NULL, '2026-05-16T18:00:00.000Z', 'cmno39nwj0000iovdp54gm3kr', '2026-05-14T07:05:47.662Z', '2026-05-14T07:05:47.662Z');

-- categories: 9 rows
INSERT INTO public."categories" ("id", "name", "scope", "color", "userId", "createdAt", "updatedAt") VALUES ('cmno39nx00001iovd0vgy68h4', 'Pessoal', 'TASK', '#DBEAFE', 'cmno39nwj0000iovdp54gm3kr', '2026-04-07T06:58:01.812Z', '2026-04-07T06:58:01.812Z');
INSERT INTO public."categories" ("id", "name", "scope", "color", "userId", "createdAt", "updatedAt") VALUES ('cmno39nx10002iovdujxpg1zx', 'Trabalho', 'TASK', '#FEF3C7', 'cmno39nwj0000iovdp54gm3kr', '2026-04-07T06:58:01.813Z', '2026-04-07T06:58:01.813Z');
INSERT INTO public."categories" ("id", "name", "scope", "color", "userId", "createdAt", "updatedAt") VALUES ('cmno39nx10003iovdxvwda5rr', 'Saúde', 'TASK', '#D1FAE5', 'cmno39nwj0000iovdp54gm3kr', '2026-04-07T06:58:01.813Z', '2026-04-07T06:58:01.813Z');
INSERT INTO public."categories" ("id", "name", "scope", "color", "userId", "createdAt", "updatedAt") VALUES ('cmno39nx10004iovdnpc8p78h', 'Renda', 'FINANCE', '#D1FAE5', 'cmno39nwj0000iovdp54gm3kr', '2026-04-07T06:58:01.813Z', '2026-04-07T06:58:01.813Z');
INSERT INTO public."categories" ("id", "name", "scope", "color", "userId", "createdAt", "updatedAt") VALUES ('cmno39nx10005iovddlsuq452', 'Alimentação', 'FINANCE', '#FED7AA', 'cmno39nwj0000iovdp54gm3kr', '2026-04-07T06:58:01.813Z', '2026-04-07T06:58:01.813Z');
INSERT INTO public."categories" ("id", "name", "scope", "color", "userId", "createdAt", "updatedAt") VALUES ('cmno39nx10006iovdc0vpjpej', 'Moradia', 'FINANCE', '#FEE2E2', 'cmno39nwj0000iovdp54gm3kr', '2026-04-07T06:58:01.813Z', '2026-04-07T06:58:01.813Z');
INSERT INTO public."categories" ("id", "name", "scope", "color", "userId", "createdAt", "updatedAt") VALUES ('cmnqykhry0002psvd82vmozp9', 'Venda VS Experience', 'FINANCE', '#EF4444', 'cmno39nwj0000iovdp54gm3kr', '2026-04-09T07:09:47.518Z', '2026-04-09T07:09:47.518Z');
INSERT INTO public."categories" ("id", "name", "scope", "color", "userId", "createdAt", "updatedAt") VALUES ('cmogexkg1000c84vdpzeqppep', 'Casamento', 'FINANCE', '#8B5CF6', 'cmno39nwj0000iovdp54gm3kr', '2026-04-27T02:42:05.761Z', '2026-04-27T02:42:05.761Z');
INSERT INTO public."categories" ("id", "name", "scope", "color", "userId", "createdAt", "updatedAt") VALUES ('cmogf6h44000g84vdawwcc4n8', 'Cartões', 'FINANCE', '#10B981', 'cmno39nwj0000iovdp54gm3kr', '2026-04-27T02:49:01.349Z', '2026-04-27T02:49:01.349Z');

-- tasks: 81 rows
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmnqz9ek5000f8svduuozu51a', 'Finalizar Octaverta', NULL, 'COMPLETED', 'HIGH', '2026-04-12T03:00:00.000Z', '2026-04-10T05:55:58.990Z', 'cmno39nwj0000iovdp54gm3kr', NULL, NULL, '2026-04-09T07:29:09.749Z', '2026-04-10T05:55:58.994Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmnqz9zts000g8svd6pjnmj8z', 'Fazer Integração da Multivegetal', NULL, 'COMPLETED', 'HIGH', '2026-04-11T03:00:00.000Z', '2026-04-10T05:55:58.319Z', 'cmno39nwj0000iovdp54gm3kr', NULL, NULL, '2026-04-09T07:29:37.312Z', '2026-04-10T05:55:58.344Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmnrjwuhs0000dcvdzx0rk1xk', 'Comprar ração', NULL, 'COMPLETED', 'MEDIUM', '2026-04-11T03:00:00.000Z', '2026-04-09T17:07:40.052Z', 'cmno39nwj0000iovdp54gm3kr', NULL, NULL, '2026-04-09T17:07:15.808Z', '2026-04-09T17:07:40.066Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmnsbr6ta0001u4vd2v9480ob', 'Design Thinking', 'Design Thinking - Validar', 'COMPLETED', 'HIGH', '2026-04-11T18:00:00.000Z', '2026-04-11T21:14:29.388Z', 'cmno39nwj0000iovdp54gm3kr', NULL, NULL, '2026-04-10T06:06:41.086Z', '2026-04-11T21:14:29.402Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmnsuzxp000003kvd8hmk2y7q', 'Call com o heitor', NULL, 'COMPLETED', 'URGENT', '2026-04-10T03:00:00.000Z', '2026-04-11T16:57:38.098Z', 'cmno39nwj0000iovdp54gm3kr', NULL, NULL, '2026-04-10T15:05:21.876Z', '2026-04-11T16:57:38.141Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmnuniupe00003cvddrsoh4k9', 'Juntar informações para Multi Vegetal', NULL, 'COMPLETED', 'MEDIUM', '2026-04-12T03:00:00.000Z', '2026-04-13T15:29:08.215Z', 'cmno39nwj0000iovdp54gm3kr', NULL, NULL, '2026-04-11T21:11:39.891Z', '2026-04-13T15:29:08.237Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmnunmdk100013cvdjje2r97g', 'Terminar Site do Fator Verde', NULL, 'COMPLETED', 'HIGH', '2026-04-12T03:00:00.000Z', '2026-04-12T23:12:50.944Z', 'cmno39nwj0000iovdp54gm3kr', NULL, NULL, '2026-04-11T21:14:24.289Z', '2026-04-12T23:12:50.952Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmnunmw6r00023cvd3r0mqhd3', 'Continuar Site Octaverta', NULL, 'COMPLETED', 'HIGH', '2026-04-12T03:00:00.000Z', '2026-04-13T15:29:09.051Z', 'cmno39nwj0000iovdp54gm3kr', NULL, NULL, '2026-04-11T21:14:48.435Z', '2026-04-13T15:29:09.056Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmnunpfs400033cvd4rws6zpr', 'Ajudar na Claris', NULL, 'COMPLETED', 'MEDIUM', '2026-04-12T03:00:00.000Z', '2026-04-12T03:39:11.436Z', 'cmno39nwj0000iovdp54gm3kr', NULL, NULL, '2026-04-11T21:16:47.140Z', '2026-04-12T03:39:11.465Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmnunq5et00043cvd6ypdzvhk', 'Continuar Estudo de Prompts para AIs', NULL, 'COMPLETED', 'HIGH', '2026-04-12T03:00:00.000Z', '2026-04-12T23:12:48.363Z', 'cmno39nwj0000iovdp54gm3kr', NULL, NULL, '2026-04-11T21:17:20.357Z', '2026-04-12T23:12:48.404Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmnv1gczh0001nkvdzm5ns0ni', 'Teste', NULL, 'COMPLETED', 'LOW', NULL, '2026-04-12T03:42:29.385Z', 'cmno39nwj0000iovdp54gm3kr', NULL, NULL, '2026-04-12T03:41:38.237Z', '2026-04-12T03:42:29.391Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmnx66hea0000g8vduhsgwiii', 'Fazer Reunião 13h30 Multivegetal', NULL, 'COMPLETED', 'HIGH', '2026-04-13T03:00:00.000Z', '2026-04-14T04:27:03.363Z', 'cmno39nwj0000iovdp54gm3kr', NULL, NULL, '2026-04-13T15:29:27.827Z', '2026-04-14T04:27:03.395Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmnx66rs30001g8vd7gpxv7cj', 'Reunião 18h com a Kelly', NULL, 'COMPLETED', 'MEDIUM', '2026-04-13T03:00:00.000Z', '2026-04-14T04:27:04.092Z', 'cmno39nwj0000iovdp54gm3kr', NULL, NULL, '2026-04-13T15:29:41.283Z', '2026-04-14T04:27:04.099Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmnx6720b0002g8vd51x5lwka', 'Alterações Octaverta', NULL, 'COMPLETED', 'HIGH', '2026-04-14T03:00:00.000Z', '2026-04-14T05:52:44.912Z', 'cmno39nwj0000iovdp54gm3kr', NULL, NULL, '2026-04-13T15:29:54.539Z', '2026-04-14T05:52:44.950Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmnx6fz9w0003g8vd3cif8k36', 'Reunião Diabetes 18h', NULL, 'COMPLETED', 'HIGH', '2026-04-14T03:00:00.000Z', '2026-04-15T07:18:25.908Z', 'cmno39nwj0000iovdp54gm3kr', NULL, NULL, '2026-04-13T15:36:50.900Z', '2026-04-15T07:18:25.911Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmnx6ulya0004g8vd44aciief', 'Mandar msg para Claris', NULL, 'COMPLETED', 'HIGH', '2026-04-13T03:00:00.000Z', '2026-04-13T15:59:19.887Z', 'cmno39nwj0000iovdp54gm3kr', NULL, NULL, '2026-04-13T15:48:13.474Z', '2026-04-13T15:59:19.894Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmnx7jo0x0005g8vdcpjoflzp', 'Revisar Estado Costa Flores', NULL, 'COMPLETED', 'HIGH', '2026-04-14T03:00:00.000Z', '2026-04-14T05:58:18.288Z', 'cmno39nwj0000iovdp54gm3kr', NULL, NULL, '2026-04-13T16:07:42.561Z', '2026-04-14T05:58:18.296Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmnxxzwmq0000twvdcn9svd27', 'Refazer Copy da Eleva', NULL, 'COMPLETED', 'HIGH', '2026-04-14T03:00:00.000Z', '2026-04-16T06:22:00.893Z', 'cmno39nwj0000iovdp54gm3kr', NULL, NULL, '2026-04-14T04:28:10.227Z', '2026-04-16T06:22:00.906Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmnxyegr80001twvd2usccmel', 'Ajustes no Fator Verde', NULL, 'COMPLETED', 'HIGH', '2026-04-14T03:00:00.000Z', '2026-04-15T07:18:25.135Z', 'cmno39nwj0000iovdp54gm3kr', NULL, NULL, '2026-04-14T04:39:29.492Z', '2026-04-15T07:18:25.153Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmo0x1ipd000114vd9ityanbi', 'Copywriting', NULL, 'COMPLETED', 'HIGH', NULL, '2026-04-16T06:25:42.044Z', 'cmno39nwj0000iovdp54gm3kr', NULL, NULL, '2026-04-16T06:24:44.401Z', '2026-04-16T06:25:42.049Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmo0x1p33000214vd17huhoyq', 'Design Wireframe', NULL, 'COMPLETED', 'HIGH', NULL, '2026-04-16T06:25:40.438Z', 'cmno39nwj0000iovdp54gm3kr', NULL, NULL, '2026-04-16T06:24:52.671Z', '2026-04-16T06:25:40.445Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmo0x1yqs000314vd1uh3wbwl', 'Desenvolvimento de Páginas', 'Páginas Institucionais Internas', 'COMPLETED', 'HIGH', '2026-04-17T18:00:00.000Z', '2026-04-16T06:25:43.460Z', 'cmno39nwj0000iovdp54gm3kr', NULL, NULL, '2026-04-16T06:25:05.188Z', '2026-04-16T06:25:43.466Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmo0x2k1h000414vdsp4eauyn', 'Desenvolvimento de Vitrine', NULL, 'COMPLETED', 'HIGH', NULL, '2026-05-04T03:16:29.353Z', 'cmno39nwj0000iovdp54gm3kr', NULL, NULL, '2026-04-16T06:25:32.789Z', '2026-05-04T03:16:29.370Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmo0x2o8u000514vdqz5ri0jj', 'Finalização', NULL, 'COMPLETED', 'HIGH', NULL, '2026-04-21T15:31:27.992Z', 'cmno39nwj0000iovdp54gm3kr', NULL, NULL, '2026-04-16T06:25:38.238Z', '2026-04-21T15:31:27.996Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmo0x9vyq000614vdsfy2ayau', 'Desenvolvimento', NULL, 'COMPLETED', 'HIGH', NULL, '2026-04-21T15:27:21.890Z', 'cmno39nwj0000iovdp54gm3kr', NULL, NULL, '2026-04-16T06:31:14.834Z', '2026-04-21T15:27:21.915Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmo0xanfr000814vd50qpyq7d', 'Reunião de alinhamento', NULL, 'COMPLETED', 'HIGH', NULL, '2026-04-16T06:32:08.469Z', 'cmno39nwj0000iovdp54gm3kr', NULL, NULL, '2026-04-16T06:31:50.439Z', '2026-04-16T06:32:08.474Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmo0xaryn000914vduo9txsjk', 'Analise de Design', NULL, 'COMPLETED', 'HIGH', NULL, '2026-04-16T06:32:07.665Z', 'cmno39nwj0000iovdp54gm3kr', NULL, NULL, '2026-04-16T06:31:56.303Z', '2026-04-16T06:32:07.670Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmo0xavow000a14vd2bo9d12k', 'Desenvolvimento', NULL, 'COMPLETED', 'HIGH', NULL, '2026-04-21T15:31:27.180Z', 'cmno39nwj0000iovdp54gm3kr', NULL, NULL, '2026-04-16T06:32:01.136Z', '2026-04-21T15:31:27.184Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmo0xazev000b14vdtl73sf7t', 'Entrega', NULL, 'COMPLETED', 'HIGH', NULL, '2026-04-21T15:31:26.391Z', 'cmno39nwj0000iovdp54gm3kr', NULL, NULL, '2026-04-16T06:32:05.959Z', '2026-04-21T15:31:26.394Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmo2u3fow00006wvdjsc11i2j', 'Teste', 'Teste', 'COMPLETED', 'HIGH', '2026-04-18T18:00:00.000Z', '2026-05-04T03:16:43.688Z', 'cmno39nwj0000iovdp54gm3kr', NULL, NULL, '2026-04-17T14:37:47.312Z', '2026-05-04T03:16:43.692Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmo2ubps700036wvd4hom4r90', 'UX Research', NULL, 'COMPLETED', 'MEDIUM', NULL, '2026-05-04T03:16:44.065Z', 'cmno39nwj0000iovdp54gm3kr', NULL, NULL, '2026-04-17T14:44:13.639Z', '2026-05-04T03:16:44.071Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmo2ubyjb00046wvdub7b112x', 'Desenvolvimento', NULL, 'COMPLETED', 'MEDIUM', NULL, '2026-04-17T14:44:38.072Z', 'cmno39nwj0000iovdp54gm3kr', NULL, NULL, '2026-04-17T14:44:24.984Z', '2026-04-17T14:44:38.088Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmo8lnebd00007ovd1rprmlyk', 'Finalizar a Octaverta', 'Finalizar a Octaverta', 'COMPLETED', 'URGENT', '2026-04-21T18:00:00.000Z', '2026-05-04T03:16:28.555Z', 'cmno39nwj0000iovdp54gm3kr', NULL, NULL, '2026-04-21T15:27:59.161Z', '2026-05-04T03:16:28.562Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmo8lo1vl00017ovd84loqxu3', 'Finalizar Claris (máximo possível para enviar)', 'Finalizar Claris (máximo possível para enviar)', 'COMPLETED', 'URGENT', '2026-04-21T18:00:00.000Z', '2026-05-04T03:16:41.774Z', 'cmno39nwj0000iovdp54gm3kr', NULL, NULL, '2026-04-21T15:28:29.697Z', '2026-05-04T03:16:41.780Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmo8lou7700027ovd99hbj4hf', 'Subir site no domínio da Eleva', 'Subir site no domínio da Eleva', 'COMPLETED', 'HIGH', '2026-04-21T18:00:00.000Z', '2026-05-04T03:16:43.237Z', 'cmno39nwj0000iovdp54gm3kr', NULL, NULL, '2026-04-21T15:29:06.403Z', '2026-05-04T03:16:43.244Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmoak6klw0000m4vd0e6knmvo', 'Reunião com a Kelly', NULL, 'COMPLETED', 'URGENT', '2026-04-22T03:00:00.000Z', '2026-05-04T03:16:42.703Z', 'cmno39nwj0000iovdp54gm3kr', NULL, NULL, '2026-04-23T00:22:26.900Z', '2026-05-04T03:16:42.711Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmoqgt1jo000agovdj6f8y40s', 'Reunião com Kelly 14h', NULL, 'COMPLETED', 'MEDIUM', '2026-05-04T03:00:00.000Z', '2026-05-05T03:24:05.060Z', 'cmno39nwj0000iovdp54gm3kr', NULL, NULL, '2026-05-04T03:32:15.637Z', '2026-05-05T03:24:05.069Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmoqgzeha000bgovd1hh04iet', 'Enviar e Revisar Proposta Personalis', NULL, 'COMPLETED', 'HIGH', '2026-05-04T03:00:00.000Z', '2026-05-05T03:24:03.384Z', 'cmno39nwj0000iovdp54gm3kr', NULL, NULL, '2026-05-04T03:37:12.334Z', '2026-05-05T03:24:03.394Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmoqgzocp000cgovddsccc6zt', 'Validar The One Office', NULL, 'COMPLETED', 'MEDIUM', '2026-05-04T03:00:00.000Z', '2026-05-05T03:24:04.242Z', 'cmno39nwj0000iovdp54gm3kr', NULL, NULL, '2026-05-04T03:37:25.129Z', '2026-05-05T03:24:04.249Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmoqh4tki000dgovdldiv10k2', 'Mandar outra Mensagem para Mayara', NULL, 'COMPLETED', 'URGENT', '2026-05-04T03:00:00.000Z', '2026-05-05T03:24:02.153Z', 'cmno39nwj0000iovdp54gm3kr', NULL, NULL, '2026-05-04T03:41:25.170Z', '2026-05-05T03:24:02.193Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmorvyomr000020vdzip5scyr', 'Finalizar Alterações Kelly', NULL, 'COMPLETED', 'URGENT', '2026-05-04T03:00:00.000Z', '2026-05-13T04:28:09.404Z', 'cmno39nwj0000iovdp54gm3kr', NULL, NULL, '2026-05-05T03:24:19.251Z', '2026-05-13T04:28:09.408Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmorvz03v000120vd6rgtdm9d', 'Fazer alterações restantes da Octaverta', NULL, 'COMPLETED', 'HIGH', NULL, '2026-05-13T04:28:08.856Z', 'cmno39nwj0000iovdp54gm3kr', NULL, NULL, '2026-05-05T03:24:34.123Z', '2026-05-13T04:28:08.881Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmp3dtbeq00009cvd95ua17i4', 'Subir Produtos da Octaverta', 'Subir Produtos da Octaverta - Falar sobre os 480 sem imagens que subiram', 'COMPLETED', 'URGENT', '2026-05-13T18:00:00.000Z', '2026-05-13T06:10:42.853Z', 'cmno39nwj0000iovdp54gm3kr', NULL, NULL, '2026-05-13T04:29:29.858Z', '2026-05-13T06:10:42.867Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmp3dtkjw00019cvd15fopbo9', 'Entrar no Mercado Livre da Multivegetal', 'Entrar no Mercado Livre da Multivegetal', 'COMPLETED', 'HIGH', NULL, '2026-05-13T04:59:39.126Z', 'cmno39nwj0000iovdp54gm3kr', NULL, NULL, '2026-05-13T04:29:41.708Z', '2026-05-13T04:59:39.143Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmp3dxt9w00029cvd70do34sa', 'Finalizar Site da Lava Roupa', 'Finalizar Site da Lava Roupa', 'COMPLETED', 'HIGH', '2026-05-14T18:00:00.000Z', '2026-05-14T06:59:09.129Z', 'cmno39nwj0000iovdp54gm3kr', NULL, NULL, '2026-05-13T04:32:59.636Z', '2026-05-14T06:59:09.144Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmp3dy6fa00039cvd14kkyknk', 'Finalizar Site da Professora de Inglês', 'Finalizar Site da Professora de Inglês', 'COMPLETED', 'HIGH', '2026-05-15T18:00:00.000Z', '2026-05-14T06:59:09.052Z', 'cmno39nwj0000iovdp54gm3kr', NULL, NULL, '2026-05-13T04:33:16.678Z', '2026-05-14T06:59:09.065Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmp3e2oma00049cvd34bvbde1', 'Resolver Etiquetas da Lauvic', 'Resolver Etiquetas da Lauvic', 'COMPLETED', 'HIGH', '2026-05-13T18:00:00.000Z', '2026-05-13T04:59:42.820Z', 'cmno39nwj0000iovdp54gm3kr', NULL, NULL, '2026-05-13T04:36:46.882Z', '2026-05-13T04:59:42.834Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmp4yxa8c000a6svdgqdhbeth', 'Copy', NULL, 'COMPLETED', 'MEDIUM', NULL, '2026-05-14T07:08:30.965Z', 'cmno39nwj0000iovdp54gm3kr', 'cmp4ympi700016svd9mzt75g7', NULL, '2026-05-14T07:08:13.069Z', '2026-05-14T07:08:30.969Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmp4yxdw3000b6svd74mhi8a1', 'Design', NULL, 'COMPLETED', 'MEDIUM', NULL, '2026-05-14T07:08:30.332Z', 'cmno39nwj0000iovdp54gm3kr', 'cmp4ympi700016svd9mzt75g7', NULL, '2026-05-14T07:08:17.811Z', '2026-05-14T07:08:30.337Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmp4yxgpj000c6svdy28y1kqa', 'Desenvolvimento', NULL, 'COMPLETED', 'MEDIUM', NULL, '2026-05-14T07:08:29.450Z', 'cmno39nwj0000iovdp54gm3kr', 'cmp4ympi700016svd9mzt75g7', NULL, '2026-05-14T07:08:21.463Z', '2026-05-14T07:08:29.458Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmp4yxloi000d6svdu1z7oxvi', '1° Revisao', NULL, 'COMPLETED', 'MEDIUM', NULL, '2026-06-06T06:50:25.388Z', 'cmno39nwj0000iovdp54gm3kr', 'cmp4ympi700016svd9mzt75g7', NULL, '2026-05-14T07:08:27.906Z', '2026-06-06T06:50:25.528Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmp4yy0j1000e6svd13mxh6w4', 'Copy', NULL, 'COMPLETED', 'MEDIUM', NULL, '2026-05-14T07:09:03.547Z', 'cmno39nwj0000iovdp54gm3kr', 'cmp4ym6er00006svd79rnoxin', NULL, '2026-05-14T07:08:47.149Z', '2026-05-14T07:09:03.553Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmp4yy4ga000f6svd31axm0br', 'Design', NULL, 'COMPLETED', 'MEDIUM', NULL, '2026-05-14T07:09:02.400Z', 'cmno39nwj0000iovdp54gm3kr', 'cmp4ym6er00006svd79rnoxin', NULL, '2026-05-14T07:08:52.234Z', '2026-05-14T07:09:02.408Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmp4yy7ex000g6svdu9kp5yvp', 'Desenvolvimento', NULL, 'COMPLETED', 'MEDIUM', NULL, '2026-05-14T07:09:03.045Z', 'cmno39nwj0000iovdp54gm3kr', 'cmp4ym6er00006svd79rnoxin', NULL, '2026-05-14T07:08:56.073Z', '2026-05-14T07:09:03.050Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmp4yyagd000h6svd9uhw6j1o', '1 revisão', NULL, 'COMPLETED', 'MEDIUM', NULL, '2026-05-28T15:23:31.135Z', 'cmno39nwj0000iovdp54gm3kr', 'cmp4ym6er00006svd79rnoxin', NULL, '2026-05-14T07:09:00.013Z', '2026-05-28T15:23:31.268Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmp4yyp29000i6svd9d2zczpf', 'Desenvolvimento', NULL, 'COMPLETED', 'MEDIUM', NULL, '2026-05-14T07:09:25.203Z', 'cmno39nwj0000iovdp54gm3kr', 'cmp4yn6o500026svd78lb2c9x', NULL, '2026-05-14T07:09:18.945Z', '2026-05-14T07:09:25.213Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmp4yyt7o000j6svdzelo8y09', 'Ultima revisão', NULL, 'COMPLETED', 'MEDIUM', NULL, '2026-05-28T15:23:39.556Z', 'cmno39nwj0000iovdp54gm3kr', 'cmp4yn6o500026svd78lb2c9x', NULL, '2026-05-14T07:09:24.324Z', '2026-05-28T15:23:39.689Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmp4yz26t000k6svdqny3q4jq', '1 revisão', NULL, 'COMPLETED', 'MEDIUM', NULL, '2026-05-14T07:09:37.418Z', 'cmno39nwj0000iovdp54gm3kr', 'cmp4yn6o500026svd78lb2c9x', NULL, '2026-05-14T07:09:35.957Z', '2026-05-14T07:09:37.422Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmp4yz973000l6svdruee0h2o', 'Design', NULL, 'COMPLETED', 'MEDIUM', NULL, '2026-05-14T07:09:46.361Z', 'cmno39nwj0000iovdp54gm3kr', 'cmp4yn6o500026svd78lb2c9x', NULL, '2026-05-14T07:09:45.039Z', '2026-05-14T07:09:46.368Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmp4yzd2v000m6svd04voz59w', 'Reunião', NULL, 'COMPLETED', 'MEDIUM', NULL, '2026-05-14T07:09:51.011Z', 'cmno39nwj0000iovdp54gm3kr', 'cmp4yn6o500026svd78lb2c9x', NULL, '2026-05-14T07:09:50.072Z', '2026-05-14T07:09:51.019Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmp4yzmu0000n6svd4btm206z', 'Estrutura', NULL, 'COMPLETED', 'MEDIUM', NULL, '2026-05-14T07:10:06.697Z', 'cmno39nwj0000iovdp54gm3kr', 'cmp4yo3qs00036svda37mwrv1', NULL, '2026-05-14T07:10:02.712Z', '2026-05-14T07:10:06.702Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmp4yzoug000o6svd6xc9rxt8', 'Posts', NULL, 'PENDING', 'MEDIUM', NULL, NULL, 'cmno39nwj0000iovdp54gm3kr', 'cmp4yo3qs00036svda37mwrv1', NULL, '2026-05-14T07:10:05.320Z', '2026-05-14T07:10:05.320Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmp4yzuy6000p6svd7iuebupe', 'Planejamento', NULL, 'COMPLETED', 'MEDIUM', NULL, '2026-05-14T07:10:31.965Z', 'cmno39nwj0000iovdp54gm3kr', 'cmp4yolgr00046svdm4m6yamv', NULL, '2026-05-14T07:10:13.230Z', '2026-05-14T07:10:31.971Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmp4yzwxz000q6svd3oxr4f6f', 'Copy', NULL, 'COMPLETED', 'MEDIUM', NULL, '2026-05-14T07:10:31.166Z', 'cmno39nwj0000iovdp54gm3kr', 'cmp4yolgr00046svdm4m6yamv', NULL, '2026-05-14T07:10:15.815Z', '2026-05-14T07:10:31.173Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmp4yzzzt000r6svdye5rz4od', 'Design', NULL, 'COMPLETED', 'MEDIUM', NULL, '2026-05-28T15:23:48.743Z', 'cmno39nwj0000iovdp54gm3kr', 'cmp4yolgr00046svdm4m6yamv', NULL, '2026-05-14T07:10:19.769Z', '2026-05-28T15:23:48.875Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmp4z02pg000s6svd89cmtx2c', 'Desenvolvimento', NULL, 'COMPLETED', 'MEDIUM', NULL, '2026-05-28T15:23:46.289Z', 'cmno39nwj0000iovdp54gm3kr', 'cmp4yolgr00046svdm4m6yamv', NULL, '2026-05-14T07:10:23.284Z', '2026-05-28T15:23:46.423Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmp4z07bd000t6svdmrref3ai', '1° Revisão', NULL, 'COMPLETED', 'MEDIUM', NULL, '2026-05-28T15:23:51.430Z', 'cmno39nwj0000iovdp54gm3kr', 'cmp4yolgr00046svdm4m6yamv', NULL, '2026-05-14T07:10:29.257Z', '2026-05-28T15:23:51.561Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmp4z0fzm000u6svd9t1n2yu5', 'Criação de contrato', NULL, 'COMPLETED', 'MEDIUM', NULL, '2026-05-28T15:22:27.899Z', 'cmno39nwj0000iovdp54gm3kr', 'cmp4yp8k300056svdpxwl109a', NULL, '2026-05-14T07:10:40.498Z', '2026-05-28T15:22:28.036Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmp4z0lvh000v6svdv917ci4t', 'Desenvolvimento 1° Sexta', NULL, 'PENDING', 'MEDIUM', NULL, NULL, 'cmno39nwj0000iovdp54gm3kr', 'cmp4yp8k300056svdpxwl109a', NULL, '2026-05-14T07:10:48.125Z', '2026-05-14T07:10:48.125Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmp4z0wwt000w6svd15nih6kp', 'Copy e Estrutura', NULL, 'COMPLETED', 'MEDIUM', NULL, '2026-05-14T07:11:08.416Z', 'cmno39nwj0000iovdp54gm3kr', 'cmp4yqpc800066svd9o96m0o0', NULL, '2026-05-14T07:11:02.430Z', '2026-05-14T07:11:08.419Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmp4z10t7000x6svdw3z7ktb9', '1° Revisão', NULL, 'COMPLETED', 'MEDIUM', NULL, '2026-05-28T15:23:25.358Z', 'cmno39nwj0000iovdp54gm3kr', 'cmp4yqpc800066svd9o96m0o0', NULL, '2026-05-14T07:11:07.483Z', '2026-05-28T15:23:25.495Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmp4z16hb000y6svdof4ht4d9', 'Planejamento', NULL, 'COMPLETED', 'MEDIUM', NULL, '2026-06-06T06:50:07.751Z', 'cmno39nwj0000iovdp54gm3kr', 'cmp4yrgjm00076svdj0rbnlef', NULL, '2026-05-14T07:11:14.831Z', '2026-06-06T06:50:07.896Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmp4z18id000z6svdbf28r5mr', 'Contrato', NULL, 'COMPLETED', 'MEDIUM', NULL, '2026-05-14T07:11:23.876Z', 'cmno39nwj0000iovdp54gm3kr', 'cmp4yrgjm00076svdj0rbnlef', NULL, '2026-05-14T07:11:17.461Z', '2026-05-14T07:11:23.883Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmp4z1cik00106svdvwes5j0s', 'Desenvolvimento', NULL, 'COMPLETED', 'MEDIUM', NULL, '2026-06-06T06:50:07.762Z', 'cmno39nwj0000iovdp54gm3kr', 'cmp4yrgjm00076svdj0rbnlef', NULL, '2026-05-14T07:11:22.652Z', '2026-06-06T06:50:07.901Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmp4z1li300116svd9tal9k18', 'Subir ultimos Produtos', NULL, 'COMPLETED', 'MEDIUM', NULL, '2026-05-28T15:23:17.673Z', 'cmno39nwj0000iovdp54gm3kr', 'cmp4ys0lx00086svdovv5gjdy', NULL, '2026-05-14T07:11:34.299Z', '2026-05-28T15:23:17.807Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmp4z1pku00126svdfome85ie', 'Subir no domínio principal', NULL, 'COMPLETED', 'MEDIUM', NULL, '2026-05-28T15:23:19.903Z', 'cmno39nwj0000iovdp54gm3kr', 'cmp4ys0lx00086svdovv5gjdy', NULL, '2026-05-14T07:11:39.582Z', '2026-05-28T15:23:20.037Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmp4z1v5l00136svdnz8dk3qh', 'Subir Headman', NULL, 'COMPLETED', 'MEDIUM', NULL, '2026-05-14T07:11:50.375Z', 'cmno39nwj0000iovdp54gm3kr', 'cmp4ys0lx00086svdovv5gjdy', NULL, '2026-05-14T07:11:46.809Z', '2026-05-14T07:11:50.381Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmp4z280m00146svd0ywarsm1', 'Aguardando aprovação', NULL, 'COMPLETED', 'MEDIUM', NULL, '2026-05-28T15:23:11.180Z', 'cmno39nwj0000iovdp54gm3kr', 'cmp4yu61a00096svd3igdnlpx', NULL, '2026-05-14T07:12:03.478Z', '2026-05-28T15:23:11.312Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmppgr3hz000ojcvdck2y2g3s', 'Criação de Design System', NULL, 'COMPLETED', 'MEDIUM', NULL, '2026-05-28T15:22:43.659Z', 'cmno39nwj0000iovdp54gm3kr', 'cmp4yp8k300056svdpxwl109a', NULL, '2026-05-28T15:22:41.015Z', '2026-05-28T15:22:43.790Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmppgrdx5000pjcvdwwsbqipj', 'Desenvolvimento base para PWO', NULL, 'COMPLETED', 'MEDIUM', NULL, '2026-05-28T15:22:57.948Z', 'cmno39nwj0000iovdp54gm3kr', 'cmp4yp8k300056svdpxwl109a', NULL, '2026-05-28T15:22:54.521Z', '2026-05-28T15:22:58.084Z');
INSERT INTO public."tasks" ("id", "title", "description", "status", "priority", "dueDate", "completedAt", "userId", "projectId", "categoryId", "createdAt", "updatedAt") VALUES ('cmppgsrhl000qjcvdvvrnf7ev', 'Esperando Fotos', NULL, 'COMPLETED', 'MEDIUM', NULL, '2026-06-06T06:50:16.573Z', 'cmno39nwj0000iovdp54gm3kr', 'cmp4yolgr00046svdm4m6yamv', NULL, '2026-05-28T15:23:58.762Z', '2026-06-06T06:50:16.714Z');

-- notes: 1 rows
INSERT INTO public."notes" ("id", "title", "content", "color", "tags", "isPinned", "isArchived", "pinnedAt", "archivedAt", "projectId", "userId", "createdAt", "updatedAt") VALUES ('cmppgxuq6000rjcvdaz935pz9', 'Fazer 28/05', '- Finalizar Blog da SB
- Receber pagamento Diabetes
- Concluir anúncios do Mercado Livre - Multi Vegetal
- Validar site do Cliente de internet
- Validar novidades do Festival', '#FEF3C7', NULL, false, false, NULL, NULL, NULL, 'cmno39nwj0000iovdp54gm3kr', '2026-05-28T15:27:56.238Z', '2026-05-28T15:27:56.238Z');

-- finance_entries: 51 rows
INSERT INTO public."finance_entries" ("id", "type", "title", "description", "amount", "occurredAt", "userId", "categoryId", "status", "recurrence", "createdAt", "updatedAt") VALUES ('cmogerlvu000084vdsceug0h2', 'INCOME', 'PIX RECEBIDO DE FALCOTEC SERVICOS DE TECNOLOGIA LTDA | Banco 461 | CNPJ 50.782.463/0001-20  |  Mensagem - DEV', NULL, '3750.00', '2026-04-25T15:00:00.000Z', 'cmno39nwj0000iovdp54gm3kr', NULL, 'CONFIRMED', 'NONE', '2026-04-27T02:37:27.690Z', '2026-04-27T02:37:27.690Z');
INSERT INTO public."finance_entries" ("id", "type", "title", "description", "amount", "occurredAt", "userId", "categoryId", "status", "recurrence", "createdAt", "updatedAt") VALUES ('cmogerlwx000184vd4bybihr7', 'INCOME', 'PIX RECEBIDO DE LUIZ MIGUEL MEDEIROS ALVES | Banco 336 | CPF ***.795.568-**', NULL, '300.00', '2026-04-22T15:00:00.000Z', 'cmno39nwj0000iovdp54gm3kr', NULL, 'CONFIRMED', 'NONE', '2026-04-27T02:37:27.729Z', '2026-04-27T02:37:27.729Z');
INSERT INTO public."finance_entries" ("id", "type", "title", "description", "amount", "occurredAt", "userId", "categoryId", "status", "recurrence", "createdAt", "updatedAt") VALUES ('cmogerlyd000284vdb3wiyu9z', 'INCOME', 'PIX RECEBIDO DE VINICIUS TRAFEGO | Banco 077 | CNPJ 22.699.082/0001-47', NULL, '800.00', '2026-04-17T15:00:00.000Z', 'cmno39nwj0000iovdp54gm3kr', NULL, 'CONFIRMED', 'NONE', '2026-04-27T02:37:27.781Z', '2026-04-27T02:37:27.781Z');
INSERT INTO public."finance_entries" ("id", "type", "title", "description", "amount", "occurredAt", "userId", "categoryId", "status", "recurrence", "createdAt", "updatedAt") VALUES ('cmogerlzg000384vd7p4pyyib', 'INCOME', 'PIX RECEBIDO DE LUIZ MIGUEL MEDEIROS ALVES | Banco 237 | CPF ***.795.568-**', NULL, '500.00', '2026-04-10T15:00:00.000Z', 'cmno39nwj0000iovdp54gm3kr', NULL, 'CONFIRMED', 'NONE', '2026-04-27T02:37:27.820Z', '2026-04-27T02:37:27.820Z');
INSERT INTO public."finance_entries" ("id", "type", "title", "description", "amount", "occurredAt", "userId", "categoryId", "status", "recurrence", "createdAt", "updatedAt") VALUES ('cmogerm0q000484vdf8u0a23b', 'INCOME', 'PIX RECEBIDO DE LUIZ MIGUEL MEDEIROS ALVES | Banco 237 | CPF ***.795.568-**', NULL, '550.00', '2026-04-08T15:00:00.000Z', 'cmno39nwj0000iovdp54gm3kr', NULL, 'CONFIRMED', 'NONE', '2026-04-27T02:37:27.866Z', '2026-04-27T02:37:27.866Z');
INSERT INTO public."finance_entries" ("id", "type", "title", "description", "amount", "occurredAt", "userId", "categoryId", "status", "recurrence", "createdAt", "updatedAt") VALUES ('cmogerm1p000584vd1ukv548s', 'INCOME', 'PIX RECEBIDO DE CLARIS REABILITACAO ORAL LTDA | CNPJ 10.922.978/0001-64  |  Mensagem - Site', NULL, '745.00', '2026-04-07T15:00:00.000Z', 'cmno39nwj0000iovdp54gm3kr', NULL, 'CONFIRMED', 'NONE', '2026-04-27T02:37:27.901Z', '2026-04-27T02:37:27.901Z');
INSERT INTO public."finance_entries" ("id", "type", "title", "description", "amount", "occurredAt", "userId", "categoryId", "status", "recurrence", "createdAt", "updatedAt") VALUES ('cmogerm2q000684vdsznjcr8f', 'INCOME', 'PIX RECEBIDO DE LUCAS GONCALVES BRANCATTI | Banco 104 | CPF ***.690.468-**', NULL, '400.00', '2026-04-06T15:00:00.000Z', 'cmno39nwj0000iovdp54gm3kr', NULL, 'CONFIRMED', 'NONE', '2026-04-27T02:37:27.938Z', '2026-04-27T02:37:27.938Z');
INSERT INTO public."finance_entries" ("id", "type", "title", "description", "amount", "occurredAt", "userId", "categoryId", "status", "recurrence", "createdAt", "updatedAt") VALUES ('cmogetgk6000784vdq7ay1wxt', 'INCOME', 'PIX RECEBIDO DE AMPARU ASSESSORIA E ISENCOES PARA PCD LTDA | Banco 260 | CNPJ 65.176.144/0001-49', NULL, '550.00', '2026-03-31T15:00:00.000Z', 'cmno39nwj0000iovdp54gm3kr', NULL, 'CONFIRMED', 'NONE', '2026-04-27T02:38:54.102Z', '2026-04-27T02:38:54.102Z');
INSERT INTO public."finance_entries" ("id", "type", "title", "description", "amount", "occurredAt", "userId", "categoryId", "status", "recurrence", "createdAt", "updatedAt") VALUES ('cmogetglm000884vdcdpmmixt', 'INCOME', 'PIX RECEBIDO DE LUIZ MIGUEL MEDEIROS ALVES | Banco 237 | CPF ***.795.568-**', NULL, '600.00', '2026-03-30T15:00:00.000Z', 'cmno39nwj0000iovdp54gm3kr', NULL, 'CONFIRMED', 'NONE', '2026-04-27T02:38:54.154Z', '2026-04-27T02:38:54.154Z');
INSERT INTO public."finance_entries" ("id", "type", "title", "description", "amount", "occurredAt", "userId", "categoryId", "status", "recurrence", "createdAt", "updatedAt") VALUES ('cmogetgni000984vdmz6ncg60', 'INCOME', 'PIX RECEBIDO DE VINICIUS CONDINO RECHDAN GESTOR DE TRAFEGO | Banco 336 | CNPJ 22.699.082/0001-47', NULL, '80.00', '2026-03-30T15:00:00.000Z', 'cmno39nwj0000iovdp54gm3kr', NULL, 'CONFIRMED', 'NONE', '2026-04-27T02:38:54.222Z', '2026-04-27T02:38:54.222Z');
INSERT INTO public."finance_entries" ("id", "type", "title", "description", "amount", "occurredAt", "userId", "categoryId", "status", "recurrence", "createdAt", "updatedAt") VALUES ('cmogevbnx000a84vdb1tj263o', 'INCOME', 'Multivegetal', NULL, '680.00', '2026-04-27T18:00:00.000Z', 'cmno39nwj0000iovdp54gm3kr', 'cmnqykhry0002psvd82vmozp9', 'CONFIRMED', 'MONTHLY', '2026-04-27T02:40:21.069Z', '2026-04-27T02:40:21.069Z');
INSERT INTO public."finance_entries" ("id", "type", "title", "description", "amount", "occurredAt", "userId", "categoryId", "status", "recurrence", "createdAt", "updatedAt") VALUES ('cmogexagc000b84vdt87cbf83', 'EXPENSE', 'BUFFET CASAMENTO', NULL, '311.11', '2026-04-26T18:00:00.000Z', 'cmno39nwj0000iovdp54gm3kr', 'cmogexkg1000c84vdpzeqppep', 'CONFIRMED', 'NONE', '2026-04-27T02:41:52.812Z', '2026-04-27T02:42:11.611Z');
INSERT INTO public."finance_entries" ("id", "type", "title", "description", "amount", "occurredAt", "userId", "categoryId", "status", "recurrence", "createdAt", "updatedAt") VALUES ('cmogeymtr000d84vd7gjbal7i', 'EXPENSE', 'ASSESSORIA CASAMENTO', NULL, '179.00', '2026-04-26T18:00:00.000Z', 'cmno39nwj0000iovdp54gm3kr', 'cmogexkg1000c84vdpzeqppep', 'CONFIRMED', 'NONE', '2026-04-27T02:42:55.503Z', '2026-04-27T02:42:55.503Z');
INSERT INTO public."finance_entries" ("id", "type", "title", "description", "amount", "occurredAt", "userId", "categoryId", "status", "recurrence", "createdAt", "updatedAt") VALUES ('cmogf0ryn000e84vdr962e19r', 'EXPENSE', 'SALAO CASAMENTO', NULL, '938.86', '2026-04-26T18:00:00.000Z', 'cmno39nwj0000iovdp54gm3kr', 'cmogexkg1000c84vdpzeqppep', 'CONFIRMED', 'NONE', '2026-04-27T02:44:35.471Z', '2026-04-27T02:44:35.471Z');
INSERT INTO public."finance_entries" ("id", "type", "title", "description", "amount", "occurredAt", "userId", "categoryId", "status", "recurrence", "createdAt", "updatedAt") VALUES ('cmogf6bbr000f84vdvk8258qf', 'EXPENSE', 'NUBANK CRÉDITO', NULL, '590.63', '2026-04-27T18:00:00.000Z', 'cmno39nwj0000iovdp54gm3kr', 'cmogf6h44000g84vdawwcc4n8', 'CONFIRMED', 'NONE', '2026-04-27T02:48:53.847Z', '2026-04-27T02:49:11.916Z');
INSERT INTO public."finance_entries" ("id", "type", "title", "description", "amount", "occurredAt", "userId", "categoryId", "status", "recurrence", "createdAt", "updatedAt") VALUES ('cmogf7qug000h84vdnjm92yuu', 'EXPENSE', 'BTG CARTÃO', NULL, '924.99', '2026-04-27T18:00:00.000Z', 'cmno39nwj0000iovdp54gm3kr', 'cmogf6h44000g84vdawwcc4n8', 'CONFIRMED', 'NONE', '2026-04-27T02:50:00.616Z', '2026-04-27T02:50:00.616Z');
INSERT INTO public."finance_entries" ("id", "type", "title", "description", "amount", "occurredAt", "userId", "categoryId", "status", "recurrence", "createdAt", "updatedAt") VALUES ('cmogf8nna000i84vd7uuixrod', 'EXPENSE', 'PICPAY CRÉDITO', NULL, '366.58', '2026-04-26T18:00:00.000Z', 'cmno39nwj0000iovdp54gm3kr', 'cmogf6h44000g84vdawwcc4n8', 'CONFIRMED', 'NONE', '2026-04-27T02:50:43.127Z', '2026-04-27T02:50:43.127Z');
INSERT INTO public."finance_entries" ("id", "type", "title", "description", "amount", "occurredAt", "userId", "categoryId", "status", "recurrence", "createdAt", "updatedAt") VALUES ('cmppgnv100000jcvdbsgi66ia', 'EXPENSE', 'PIX ENVIADO PARA VICTOR DA SILVA SANTOS', NULL, '25.00', '2026-05-28T15:00:00.000Z', 'cmno39nwj0000iovdp54gm3kr', NULL, 'CONFIRMED', 'NONE', '2026-05-28T15:20:10.068Z', '2026-05-28T15:20:10.068Z');
INSERT INTO public."finance_entries" ("id", "type", "title", "description", "amount", "occurredAt", "userId", "categoryId", "status", "recurrence", "createdAt", "updatedAt") VALUES ('cmppgnvo00001jcvd6xe78dvh', 'INCOME', 'PIX RECEBIDO DE 54.163.079 LUIZ MIGUEL MEDEIROS ALVES | Banco 336 | CNPJ 54.163.079/0001-09', NULL, '700.00', '2026-05-27T15:00:00.000Z', 'cmno39nwj0000iovdp54gm3kr', NULL, 'CONFIRMED', 'NONE', '2026-05-28T15:20:10.896Z', '2026-05-28T15:20:10.896Z');
INSERT INTO public."finance_entries" ("id", "type", "title", "description", "amount", "occurredAt", "userId", "categoryId", "status", "recurrence", "createdAt", "updatedAt") VALUES ('cmppgnwau0002jcvdrkr8mf20', 'INCOME', 'PIX RECEBIDO DE VINICIUS TRAFEGO | Banco 077 | CNPJ 22.699.082/0001-47', NULL, '800.00', '2026-05-26T15:00:00.000Z', 'cmno39nwj0000iovdp54gm3kr', NULL, 'CONFIRMED', 'NONE', '2026-05-28T15:20:11.718Z', '2026-05-28T15:20:11.718Z');
INSERT INTO public."finance_entries" ("id", "type", "title", "description", "amount", "occurredAt", "userId", "categoryId", "status", "recurrence", "createdAt", "updatedAt") VALUES ('cmppgnwxx0003jcvd22czc9q6', 'EXPENSE', 'PIX ENVIADO PARA GIOVANA ZUCARELI SILVEIRA', NULL, '600.00', '2026-05-26T15:00:00.000Z', 'cmno39nwj0000iovdp54gm3kr', NULL, 'CONFIRMED', 'NONE', '2026-05-28T15:20:12.549Z', '2026-05-28T15:20:12.549Z');
INSERT INTO public."finance_entries" ("id", "type", "title", "description", "amount", "occurredAt", "userId", "categoryId", "status", "recurrence", "createdAt", "updatedAt") VALUES ('cmppgnxkl0004jcvdxg1m9m5p', 'INCOME', 'PIX RECEBIDO DE CLARIS MF CLINICA ODONTOLOGICA | Banco 341 | CNPJ 62.225.828/0001-03  |  Mensagem - SITE', NULL, '745.00', '2026-05-26T15:00:00.000Z', 'cmno39nwj0000iovdp54gm3kr', NULL, 'CONFIRMED', 'NONE', '2026-05-28T15:20:13.365Z', '2026-05-28T15:20:13.365Z');
INSERT INTO public."finance_entries" ("id", "type", "title", "description", "amount", "occurredAt", "userId", "categoryId", "status", "recurrence", "createdAt", "updatedAt") VALUES ('cmppgny7a0005jcvd9uixceww', 'EXPENSE', 'PIX ENVIADO PARA UBER DO BRASIL TECNOLOGIA LTDA E317C2369ACD437E8A578EE7AEC5B0CD |   Mensagem - Uber', NULL, '6.91', '2026-05-25T15:00:00.000Z', 'cmno39nwj0000iovdp54gm3kr', NULL, 'CONFIRMED', 'NONE', '2026-05-28T15:20:14.182Z', '2026-05-28T15:20:14.182Z');
INSERT INTO public."finance_entries" ("id", "type", "title", "description", "amount", "occurredAt", "userId", "categoryId", "status", "recurrence", "createdAt", "updatedAt") VALUES ('cmppgnytw0006jcvdiq6nb6wz', 'INCOME', 'PIX RECEBIDO DE VINICIUS TRAFEGO | Banco 077 | CNPJ 22.699.082/0001-47', NULL, '80.00', '2026-05-25T15:00:00.000Z', 'cmno39nwj0000iovdp54gm3kr', NULL, 'CONFIRMED', 'NONE', '2026-05-28T15:20:14.996Z', '2026-05-28T15:20:14.996Z');
INSERT INTO public."finance_entries" ("id", "type", "title", "description", "amount", "occurredAt", "userId", "categoryId", "status", "recurrence", "createdAt", "updatedAt") VALUES ('cmppgnzh50007jcvdb4jaukiv', 'INCOME', 'PIX RECEBIDO DE MULTI VEGETAL IND E COM | Banco 001 | CNPJ 00.840.754/0001-50', NULL, '680.00', '2026-05-25T15:00:00.000Z', 'cmno39nwj0000iovdp54gm3kr', NULL, 'CONFIRMED', 'NONE', '2026-05-28T15:20:15.833Z', '2026-05-28T15:20:15.833Z');
INSERT INTO public."finance_entries" ("id", "type", "title", "description", "amount", "occurredAt", "userId", "categoryId", "status", "recurrence", "createdAt", "updatedAt") VALUES ('cmppgo03u0008jcvdlczbucrg', 'EXPENSE', 'PIX ENVIADO PARA NUCLEO DE INFORMACAO E COORDENACAO DO PONTO BR NIC BR REGDOM0000046848178X0000005093298', NULL, '40.00', '2026-05-25T15:00:00.000Z', 'cmno39nwj0000iovdp54gm3kr', NULL, 'CONFIRMED', 'NONE', '2026-05-28T15:20:16.650Z', '2026-05-28T15:20:16.650Z');
INSERT INTO public."finance_entries" ("id", "type", "title", "description", "amount", "occurredAt", "userId", "categoryId", "status", "recurrence", "createdAt", "updatedAt") VALUES ('cmppgo0qj0009jcvdoqnz8lya', 'EXPENSE', 'PIX ENVIADO PARA KIWIFY TECNOLOGIA E SERVICOS LTDA I8AF78080262A4885ACE49788681FEF85', NULL, '197.00', '2026-05-25T15:00:00.000Z', 'cmno39nwj0000iovdp54gm3kr', NULL, 'CONFIRMED', 'NONE', '2026-05-28T15:20:17.467Z', '2026-05-28T15:20:17.467Z');
INSERT INTO public."finance_entries" ("id", "type", "title", "description", "amount", "occurredAt", "userId", "categoryId", "status", "recurrence", "createdAt", "updatedAt") VALUES ('cmppgo1dh000ajcvdcjva631e', 'EXPENSE', 'PIX ENVIADO PARA CLARO S A  - QRCODE - 1826400000421051051501012', NULL, '92.80', '2026-05-25T15:00:00.000Z', 'cmno39nwj0000iovdp54gm3kr', NULL, 'CONFIRMED', 'NONE', '2026-05-28T15:20:18.293Z', '2026-05-28T15:20:18.293Z');
INSERT INTO public."finance_entries" ("id", "type", "title", "description", "amount", "occurredAt", "userId", "categoryId", "status", "recurrence", "createdAt", "updatedAt") VALUES ('cmppgo20c000bjcvdafjcv954', 'EXPENSE', 'PIX ENVIADO PARA MINISTERIO DA FAZENDA  - QRCODE - 07082614566867774094014898', NULL, '87.47', '2026-05-25T15:00:00.000Z', 'cmno39nwj0000iovdp54gm3kr', NULL, 'CONFIRMED', 'NONE', '2026-05-28T15:20:19.116Z', '2026-05-28T15:20:19.116Z');
INSERT INTO public."finance_entries" ("id", "type", "title", "description", "amount", "occurredAt", "userId", "categoryId", "status", "recurrence", "createdAt", "updatedAt") VALUES ('cmppgo2mx000cjcvd73cc1k86', 'EXPENSE', 'PIX ENVIADO PARA MARCOS PAULO ALVARENGA LOPES', NULL, '938.86', '2026-05-23T15:00:00.000Z', 'cmno39nwj0000iovdp54gm3kr', NULL, 'CONFIRMED', 'NONE', '2026-05-28T15:20:19.929Z', '2026-05-28T15:20:19.929Z');
INSERT INTO public."finance_entries" ("id", "type", "title", "description", "amount", "occurredAt", "userId", "categoryId", "status", "recurrence", "createdAt", "updatedAt") VALUES ('cmppgo39r000djcvd5pq28c2y', 'EXPENSE', 'PIX ENVIADO PARA AMANDA MARINHO E SILVA ALMEIDA', NULL, '179.00', '2026-05-23T15:00:00.000Z', 'cmno39nwj0000iovdp54gm3kr', NULL, 'CONFIRMED', 'NONE', '2026-05-28T15:20:20.751Z', '2026-05-28T15:20:20.751Z');
INSERT INTO public."finance_entries" ("id", "type", "title", "description", "amount", "occurredAt", "userId", "categoryId", "status", "recurrence", "createdAt", "updatedAt") VALUES ('cmppgo3wk000ejcvd9wt3jghy', 'EXPENSE', 'PIX ENVIADO PARA BUFFET R E LTDA', NULL, '311.11', '2026-05-23T15:00:00.000Z', 'cmno39nwj0000iovdp54gm3kr', NULL, 'CONFIRMED', 'NONE', '2026-05-28T15:20:21.572Z', '2026-05-28T15:20:21.572Z');
INSERT INTO public."finance_entries" ("id", "type", "title", "description", "amount", "occurredAt", "userId", "categoryId", "status", "recurrence", "createdAt", "updatedAt") VALUES ('cmppgo4jg000fjcvdmiv0ovtb', 'EXPENSE', 'PIX ENVIADO PARA VICTOR DA SILVA SANTOS', NULL, '150.00', '2026-05-23T15:00:00.000Z', 'cmno39nwj0000iovdp54gm3kr', NULL, 'CONFIRMED', 'NONE', '2026-05-28T15:20:22.396Z', '2026-05-28T15:20:22.396Z');
INSERT INTO public."finance_entries" ("id", "type", "title", "description", "amount", "occurredAt", "userId", "categoryId", "status", "recurrence", "createdAt", "updatedAt") VALUES ('cmppgo56f000gjcvd01hhhxlo', 'EXPENSE', 'PIX ENVIADO PARA VICTOR DA SILVA SANTOS', NULL, '475.00', '2026-05-23T15:00:00.000Z', 'cmno39nwj0000iovdp54gm3kr', NULL, 'CONFIRMED', 'NONE', '2026-05-28T15:20:23.223Z', '2026-05-28T15:20:23.223Z');
INSERT INTO public."finance_entries" ("id", "type", "title", "description", "amount", "occurredAt", "userId", "categoryId", "status", "recurrence", "createdAt", "updatedAt") VALUES ('cmppgo5tb000hjcvd0cxawyt9', 'EXPENSE', 'PIX ENVIADO PARA VICTOR DA SILVA SANTOS', NULL, '492.00', '2026-05-23T15:00:00.000Z', 'cmno39nwj0000iovdp54gm3kr', NULL, 'CONFIRMED', 'NONE', '2026-05-28T15:20:24.047Z', '2026-05-28T15:20:24.047Z');
INSERT INTO public."finance_entries" ("id", "type", "title", "description", "amount", "occurredAt", "userId", "categoryId", "status", "recurrence", "createdAt", "updatedAt") VALUES ('cmppgo6fm000ijcvdrbewq6j4', 'INCOME', 'PIX RECEBIDO DE RIGAL ENGENHARIA E CONSTRUCAO LTDA | Banco 260 | CNPJ 23.876.390/0001-63', NULL, '400.00', '2026-05-22T15:00:00.000Z', 'cmno39nwj0000iovdp54gm3kr', NULL, 'CONFIRMED', 'NONE', '2026-05-28T15:20:24.850Z', '2026-05-28T15:20:24.850Z');
INSERT INTO public."finance_entries" ("id", "type", "title", "description", "amount", "occurredAt", "userId", "categoryId", "status", "recurrence", "createdAt", "updatedAt") VALUES ('cmppgo72a000jjcvdto1u2vjt', 'INCOME', 'PIX RECEBIDO DE FALCOTEC SERVICOS DE TECNOLOGIA LTDA | Banco 461 | CNPJ 50.782.463/0001-20', NULL, '3250.00', '2026-05-20T15:00:00.000Z', 'cmno39nwj0000iovdp54gm3kr', NULL, 'CONFIRMED', 'NONE', '2026-05-28T15:20:25.666Z', '2026-05-28T15:20:25.666Z');
INSERT INTO public."finance_entries" ("id", "type", "title", "description", "amount", "occurredAt", "userId", "categoryId", "status", "recurrence", "createdAt", "updatedAt") VALUES ('cmppgo7oy000kjcvdpqq1g1a6', 'INCOME', 'PIX RECEBIDO DE SANTOS E BRANCATTI MARKETING LTDA | CNPJ 22.580.612/0001-33  |  Mensagem - NFSe 25', NULL, '400.00', '2026-05-11T15:00:00.000Z', 'cmno39nwj0000iovdp54gm3kr', NULL, 'CONFIRMED', 'NONE', '2026-05-28T15:20:26.482Z', '2026-05-28T15:20:26.482Z');
INSERT INTO public."finance_entries" ("id", "type", "title", "description", "amount", "occurredAt", "userId", "categoryId", "status", "recurrence", "createdAt", "updatedAt") VALUES ('cmppgo8bw000ljcvd7xlxec7v', 'INCOME', 'PIX RECEBIDO DE AMPARU ASSESSORIA E ISENCOES PARA PCD LTDA | Banco 260 | CNPJ 65.176.144/0001-49', NULL, '550.00', '2026-05-08T15:00:00.000Z', 'cmno39nwj0000iovdp54gm3kr', NULL, 'CONFIRMED', 'NONE', '2026-05-28T15:20:27.308Z', '2026-05-28T15:20:27.308Z');
INSERT INTO public."finance_entries" ("id", "type", "title", "description", "amount", "occurredAt", "userId", "categoryId", "status", "recurrence", "createdAt", "updatedAt") VALUES ('cmppgo8yh000mjcvdp781w8mk', 'INCOME', 'PIX RECEBIDO DE DANIELE REILY DA SILVA SOUZA | Banco 033 | CPF ***.047.008-**', NULL, '333.33', '2026-05-05T15:00:00.000Z', 'cmno39nwj0000iovdp54gm3kr', NULL, 'CONFIRMED', 'NONE', '2026-05-28T15:20:28.121Z', '2026-05-28T15:20:28.121Z');
INSERT INTO public."finance_entries" ("id", "type", "title", "description", "amount", "occurredAt", "userId", "categoryId", "status", "recurrence", "createdAt", "updatedAt") VALUES ('cmppgptfo000njcvd3gd8i9kk', 'INCOME', 'Diabetes, Eu cuido', 'Ultima', '500.00', '2026-05-28T18:00:00.000Z', 'cmno39nwj0000iovdp54gm3kr', 'cmnqykhry0002psvd82vmozp9', 'CONFIRMED', 'NONE', '2026-05-28T15:21:41.316Z', '2026-05-28T15:21:41.316Z');
INSERT INTO public."finance_entries" ("id", "type", "title", "description", "amount", "occurredAt", "userId", "categoryId", "status", "recurrence", "createdAt", "updatedAt") VALUES ('cmppgzj3e000sjcvdcfalklyb', 'INCOME', 'Festival', NULL, '1000.00', '2026-06-25T18:00:00.000Z', 'cmno39nwj0000iovdp54gm3kr', 'cmnqykhry0002psvd82vmozp9', 'PREDICTED', 'NONE', '2026-05-28T15:29:14.474Z', '2026-05-28T15:29:14.474Z');
INSERT INTO public."finance_entries" ("id", "type", "title", "description", "amount", "occurredAt", "userId", "categoryId", "status", "recurrence", "createdAt", "updatedAt") VALUES ('cmpph2335000tjcvdgw32cd2k', 'INCOME', 'Cliente Internet', NULL, '1000.00', '2026-06-25T18:00:00.000Z', 'cmno39nwj0000iovdp54gm3kr', 'cmnqykhry0002psvd82vmozp9', 'PREDICTED', 'NONE', '2026-05-28T15:31:13.698Z', '2026-05-28T15:31:30.091Z');
INSERT INTO public."finance_entries" ("id", "type", "title", "description", "amount", "occurredAt", "userId", "categoryId", "status", "recurrence", "createdAt", "updatedAt") VALUES ('cmpph32tu000ujcvdi1lxv5qo', 'INCOME', 'Parcela 2 - Restaurante', NULL, '333.34', '2026-06-25T18:00:00.000Z', 'cmno39nwj0000iovdp54gm3kr', 'cmnqykhry0002psvd82vmozp9', 'PREDICTED', 'NONE', '2026-05-28T15:32:00.018Z', '2026-05-28T15:32:00.018Z');
INSERT INTO public."finance_entries" ("id", "type", "title", "description", "amount", "occurredAt", "userId", "categoryId", "status", "recurrence", "createdAt", "updatedAt") VALUES ('cmpph3yd7000vjcvd89x5o314', 'INCOME', 'Loba Vistoria', NULL, '700.00', '2026-06-25T18:00:00.000Z', 'cmno39nwj0000iovdp54gm3kr', 'cmnqykhry0002psvd82vmozp9', 'PREDICTED', 'NONE', '2026-05-28T15:32:40.891Z', '2026-05-28T15:32:45.666Z');
INSERT INTO public."finance_entries" ("id", "type", "title", "description", "amount", "occurredAt", "userId", "categoryId", "status", "recurrence", "createdAt", "updatedAt") VALUES ('cmpph4uvm000wjcvdgq6fsytz', 'INCOME', 'Multivegetal', NULL, '680.00', '2026-06-25T18:00:00.000Z', 'cmno39nwj0000iovdp54gm3kr', 'cmnqykhry0002psvd82vmozp9', 'PREDICTED', 'NONE', '2026-05-28T15:33:23.026Z', '2026-05-28T15:33:45.112Z');
INSERT INTO public."finance_entries" ("id", "type", "title", "description", "amount", "occurredAt", "userId", "categoryId", "status", "recurrence", "createdAt", "updatedAt") VALUES ('cmpph5z5t000xjcvdcn87zw3g', 'INCOME', 'Octaverta', NULL, '1095.00', '2026-06-25T18:00:00.000Z', 'cmno39nwj0000iovdp54gm3kr', 'cmnqykhry0002psvd82vmozp9', 'CONFIRMED', 'NONE', '2026-05-28T15:34:15.233Z', '2026-06-06T06:19:20.415Z');
INSERT INTO public."finance_entries" ("id", "type", "title", "description", "amount", "occurredAt", "userId", "categoryId", "status", "recurrence", "createdAt", "updatedAt") VALUES ('cmpslpxeb0000mcvdikynwyqf', 'INCOME', 'Costa Flores', NULL, '450.00', '2026-06-25T18:00:00.000Z', 'cmno39nwj0000iovdp54gm3kr', 'cmnqykhry0002psvd82vmozp9', 'CONFIRMED', 'NONE', '2026-05-30T20:05:03.059Z', '2026-05-30T20:05:03.059Z');
INSERT INTO public."finance_entries" ("id", "type", "title", "description", "amount", "occurredAt", "userId", "categoryId", "status", "recurrence", "createdAt", "updatedAt") VALUES ('cmpxymyiy0000rovdmrekisc0', 'INCOME', 'Blog SB', NULL, '400.00', '2026-06-25T18:00:00.000Z', 'cmno39nwj0000iovdp54gm3kr', 'cmnqykhry0002psvd82vmozp9', 'CONFIRMED', 'NONE', '2026-06-03T14:05:30.442Z', '2026-06-03T14:05:30.442Z');
INSERT INTO public."finance_entries" ("id", "type", "title", "description", "amount", "occurredAt", "userId", "categoryId", "status", "recurrence", "createdAt", "updatedAt") VALUES ('cmpxynh3w0001rovdcv6i3tvu', 'INCOME', 'Hospedagem', NULL, '200.00', '2026-06-25T18:00:00.000Z', 'cmno39nwj0000iovdp54gm3kr', 'cmnqykhry0002psvd82vmozp9', 'CONFIRMED', 'NONE', '2026-06-03T14:05:54.524Z', '2026-06-03T14:05:54.524Z');
INSERT INTO public."finance_entries" ("id", "type", "title", "description", "amount", "occurredAt", "userId", "categoryId", "status", "recurrence", "createdAt", "updatedAt") VALUES ('cmq1sah7x0000zwvdgydz1ept', 'INCOME', 'App Eleva', '2x', '1500.00', '2026-06-06T18:00:00.000Z', 'cmno39nwj0000iovdp54gm3kr', 'cmnqykhry0002psvd82vmozp9', 'CONFIRMED', 'MONTHLY', '2026-06-06T06:18:55.150Z', '2026-06-06T06:18:55.150Z');

COMMIT;
