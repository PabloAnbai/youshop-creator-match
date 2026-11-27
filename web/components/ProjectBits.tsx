// Shared UI building blocks for creator cards and creator detail views.
import {
  complianceBadge,
  CONVERSION_LABELS,
  MATURITY_LABELS,
  REFUND_RISK_LABELS,
} from "@/lib/labels";
import type { Creator, RankedCreator } from "@/lib/types";

export function fmtFollowers(n: number): string {
  if (n >= 1000) {
    return `${(n / 1000).toFixed(n >= 100_000 ? 0 : 1).replace(".", ",")} mil`;
  }
  return String(n);
}

export function ComplianceBadge({ creator }: { creator: Creator }) {
  const badge = complianceBadge(creator.adComplianceScore);
  return (
    <span
      title={creator.disclosureNotes}
      className={`rounded-full border border-current/25 px-2.5 py-0.5 text-xs font-medium ${badge.className}`}
    >
      {badge.label}
    </span>
  );
}

export function ProfileBand({ ranked }: { ranked: RankedCreator }) {
  const { creator, score, reasons } = ranked;
  const tone = MATURITY_LABELS[creator.maturity];

  return (
    <div
      className={`flex flex-wrap items-center gap-x-2 gap-y-1 px-5 py-2 text-xs sm:px-6 ${tone.toneSoft} ${tone.toneText}`}
    >
      <span className={`h-2 w-2 rounded-full ${tone.toneDot}`} />
      <span
        className="cursor-help font-semibold underline decoration-dotted underline-offset-2"
        title={tone.hint}
      >
        {tone.label}
      </span>
      <span className="rounded-full bg-emerald-600 px-2 py-px font-semibold tabular-nums text-white">
        Match {score}%
      </span>
      {reasons.length > 0 && <span className="opacity-90">· {reasons.join(" · ")}</span>}
    </div>
  );
}

export function BigNumbers({ creator: c, full = false }: { creator: Creator; full?: boolean }) {
  const tone = MATURITY_LABELS[c.maturity];
  const risk = REFUND_RISK_LABELS[c.refundOrChargebackRisk];

  const items: { value: string; label: string; highlightClass?: string }[] = [
    {
      value: `${c.engagementRate.toFixed(1).replace(".", ",")}%`,
      label: "taxa de engajamento",
    },
    {
      value: `~${c.avgMonthlySales}/mês`,
      label: `${CONVERSION_LABELS[c.estimatedConversionTier].toLowerCase()} (simulado)`,
    },
    {
      value: risk.label.replace("Risco ", "").replace(" de estorno", ""),
      label: "risco de estorno / chargeback",
      highlightClass: risk.className,
    },
  ];

  if (full) {
    items.push(
      {
        value: fmtFollowers(c.followers),
        label: "seguidores totais estimados",
      },
      {
        value: `${c.recentPerformance.approvalRate}%`,
        label: "aprovação de pedidos (90d)",
      },
      {
        value: `R$ ${c.recentPerformance.avgTicketBrl}`,
        label: "ticket médio convertido",
      },
    );
  }

  return (
    <dl className={`grid gap-3 ${full ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-3"}`}>
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt className="sr-only">{item.label}</dt>
          <dd
            className={`font-display text-2xl font-semibold tabular-nums leading-none ${
              item.highlightClass ?? tone.toneText
            }`}
          >
            {item.value}
          </dd>
          <span className="mt-1 block text-xs leading-snug text-muted">{item.label}</span>
        </div>
      ))}
    </dl>
  );
}

export function RecentActivity({
  creator,
  compact = false,
}: {
  creator: Creator;
  compact?: boolean;
}) {
  const p = creator.recentPerformance;
  if (compact) {
    return (
      <p className="text-xs text-muted">
        <span className="font-medium text-foreground/80">{p.period}:</span>{" "}
        {p.clicks.toLocaleString("pt-BR")} cliques rastreados ·{" "}
        {p.conversions.toLocaleString("pt-BR")} conversões · aprovação de {p.approvalRate}%
      </p>
    );
  }

  const max = Math.max(1, p.clicks);
  const convPct = Math.max(2, Math.round((p.conversions / max) * 100));

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        Desempenho rastreado em {p.period.toLowerCase()} (dados sintéticos para simulação de funil).
      </p>
      <div className="space-y-2 text-sm">
        <div className="grid grid-cols-[1fr_auto] items-center gap-3">
          <div className="h-2.5 w-full rounded-full bg-zinc-400/45" />
          <span className="tabular-nums">
            <b>{p.clicks.toLocaleString("pt-BR")}</b> cliques rastreados
          </span>
        </div>
        <div className="grid grid-cols-[1fr_auto] items-center gap-3">
          <div className="h-2.5 rounded-full bg-emerald-500" style={{ width: `${convPct}%` }} />
          <span className="tabular-nums">
            <b>{p.conversions.toLocaleString("pt-BR")}</b> vendas aprovadas ({p.approvalRate}%)
          </span>
        </div>
      </div>
    </div>
  );
}

export function ComplianceChecks({ creator }: { creator: Creator }) {
  const checks = [
    {
      ok: creator.adComplianceScore >= 85,
      text: `Score de transparência publicitária (CONAR / #publi): ${creator.adComplianceScore}/100`,
    },
    {
      ok: creator.refundOrChargebackRisk === "baixo",
      text:
        creator.refundOrChargebackRisk === "baixo"
          ? "Histórico simulado com baixo índice de devolução e estorno."
          : `Risco ${creator.refundOrChargebackRisk} de estorno: requer alinhamento prévio de expectativas.`,
    },
    {
      ok: creator.recentPerformance.approvalRate >= 92,
      text: `Taxa de aprovação de pedidos rastreados de ${creator.recentPerformance.approvalRate}%.`,
    },
    {
      ok: true,
      text: creator.disclosureNotes,
    },
  ];

  return (
    <ul className="space-y-2">
      {checks.map((c) => (
        <li key={c.text} className="flex gap-2 text-sm">
          <span aria-hidden className={c.ok ? "text-emerald-600" : "text-amber-600"}>
            {c.ok ? "✓" : "!"}
          </span>
          <span className={c.ok ? "" : "text-foreground/85"}>{c.text}</span>
        </li>
      ))}
    </ul>
  );
}
