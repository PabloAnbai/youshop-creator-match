import type { Channel, ComplianceFloor, Maturity, Niche, Tier } from "./types";

export const NICHE_LABELS: Record<Niche, string> = {
  cosmeticos: "Cosméticos",
  "cuidados-pessoais": "Cuidados pessoais",
  suplementos: "Suplementos",
  fitness: "Fitness & treino",
  cursos: "Cursos digitais",
  produtividade: "Produtividade",
  softwares: "Softwares & SaaS",
  tech: "Tech & IA",
  moda: "Moda",
  acessorios: "Acessórios",
};

export const CHANNEL_LABELS: Record<Channel, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  blog: "Blog / SEO",
  comunidades: "Comunidades",
  "trafego-pago": "Tráfego pago",
};

export const MATURITY_LABELS: Record<
  Maturity,
  { label: string; hint: string; badgeClass: string; toneText: string; toneSoft: string; toneDot: string }
> = {
  recorrente: {
    label: "Creator recorrente",
    hint: "Histórico consistente de vendas rastreáveis, cadência estável e boa previsibilidade de campanha.",
    badgeClass:
      "bg-emerald-50 text-emerald-800 ring-emerald-600/20 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-400/30",
    toneText: "text-emerald-700 dark:text-emerald-400",
    toneSoft: "bg-emerald-500/10",
    toneDot: "bg-emerald-500",
  },
  "em-crescimento": {
    label: "Em crescimento",
    hint: "Audiência engajada e em expansão, ótimo equilíbrio entre alcance, proximidade e custo de ativação.",
    badgeClass:
      "bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-400/30",
    toneText: "text-amber-700 dark:text-amber-400",
    toneSoft: "bg-amber-500/10",
    toneDot: "bg-amber-500",
  },
  iniciante: {
    label: "Iniciante / Micro",
    hint: "Alta proximidade com nicho e comunidade, ideal para testes por comissão sem fee fixo elevado.",
    badgeClass:
      "bg-violet-50 text-violet-800 ring-violet-600/20 dark:bg-violet-950 dark:text-violet-300 dark:ring-violet-400/30",
    toneText: "text-violet-700 dark:text-violet-400",
    toneSoft: "bg-violet-500/10",
    toneDot: "bg-violet-500",
  },
};

export const CONVERSION_LABELS: Record<Tier, string> = {
  alto: "Conversão alta",
  medio: "Conversão média",
  baixo: "Conversão inicial",
};

export const REFUND_RISK_LABELS: Record<Tier, { label: string; className: string }> = {
  baixo: { label: "Risco baixo de estorno", className: "text-emerald-700 dark:text-emerald-400" },
  medio: { label: "Risco moderado", className: "text-amber-700 dark:text-amber-400" },
  alto: { label: "Risco elevado de estorno", className: "text-red-700 dark:text-red-400" },
};

export const COMPLIANCE_FLOOR_LABELS: Record<ComplianceFloor, string> = {
  0: "Qualquer score",
  75: "75+ (bom)",
  85: "85+ (rigoroso)",
  92: "92+ (exemplar)",
};

export function complianceBadge(score: number): { label: string; className: string } {
  if (score >= 90) {
    return {
      label: `Compliance ${score}/100`,
      className: "text-emerald-700 dark:text-emerald-400",
    };
  }
  if (score >= 78) {
    return {
      label: `Compliance ${score}/100`,
      className: "text-amber-700 dark:text-amber-400",
    };
  }
  return {
    label: `Atenção CONAR (${score}/100)`,
    className: "text-red-700 dark:text-red-400",
  };
}
