/**
 * lib/plans.ts
 *
 * Sistema centralizado de planos e entitlements.
 *
 * Toda verificação de acesso a recursos ou limites DEVE passar por aqui.
 * Não espalhe condicionais de plano pelo código — use os helpers abaixo.
 */

import { UserPlan } from "@/generated/prisma/enums";

// ─── Tipos ────────────────────────────────────────────────────────────────

export type PlanResource = "tasks" | "projects" | "notes" | "categories";

export type PlanFeature =
  | "finance"          // Módulo financeiro
  | "advancedDashboard" // Dashboard com dados reais e gráficos
  | "export";          // Exportação de dados (futura)

export interface PlanConfig {
  label: string;
  limits: Record<PlanResource, number>;
  features: Record<PlanFeature, boolean>;
}

// ─── Definição dos planos ─────────────────────────────────────────────────

export const PLANS: Record<UserPlan, PlanConfig> = {
  FREE: {
    label: "Free",
    limits: {
      tasks: 20,
      projects: 3,
      notes: 20,
      categories: 10,
    },
    features: {
      finance: false,
      advancedDashboard: false,
      export: false,
    },
  },

  PRO: {
    label: "Pro",
    limits: {
      tasks: 200,
      projects: 20,
      notes: 200,
      categories: 50,
    },
    features: {
      finance: true,
      advancedDashboard: true,
      export: false,
    },
  },

  BUSINESS: {
    label: "Business",
    limits: {
      tasks: 2000,
      projects: 200,
      notes: 2000,
      categories: 500,
    },
    features: {
      finance: true,
      advancedDashboard: true,
      export: true,
    },
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────

/**
 * Retorna a configuração do plano do usuário.
 */
export function getPlanConfig(plan: UserPlan): PlanConfig {
  return PLANS[plan];
}

/**
 * Verifica se o usuário pode criar mais itens do tipo `resource`.
 * Retorna `true` se o limite ainda não foi atingido.
 */
export function canCreate(
  plan: UserPlan,
  resource: PlanResource,
  currentCount: number
): boolean {
  return currentCount < PLANS[plan].limits[resource];
}

/**
 * Retorna a mensagem de erro quando o limite do plano é atingido.
 */
export function limitReachedMessage(
  plan: UserPlan,
  resource: PlanResource
): string {
  const limit = PLANS[plan].limits[resource];
  const planLabel = PLANS[plan].label;
  const resourceLabels: Record<PlanResource, string> = {
    tasks: "tarefas",
    projects: "projetos",
    notes: "anotações",
    categories: "categorias",
  };
  return `Limite atingido: o plano ${planLabel} permite até ${limit} ${resourceLabels[resource]}. Faça upgrade para continuar.`;
}

/**
 * Verifica se uma feature está disponível no plano.
 */
export function hasFeature(plan: UserPlan, feature: PlanFeature): boolean {
  return PLANS[plan].features[feature];
}

/**
 * Retorna a mensagem de bloqueio quando uma feature não está disponível.
 */
export function featureBlockedMessage(feature: PlanFeature): string {
  const labels: Record<PlanFeature, string> = {
    finance: "Módulo Financeiro",
    advancedDashboard: "Dashboard Avançado",
    export: "Exportação de Dados",
  };
  return `${labels[feature]} não está disponível no seu plano atual. Faça upgrade para acessar.`;
}
