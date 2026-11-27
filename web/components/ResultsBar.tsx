"use client";
// Search, quick narrowing chips, and deterministic sort controls for ranked creators.
import { CHANNEL_LABELS, MATURITY_LABELS, NICHE_LABELS } from "@/lib/labels";
import type { Maturity, RankedCreator } from "@/lib/types";

export type Sort = "match" | "compliance" | "engagement" | "sales";

export type ResultFilter = {
  maturities: Maturity[];
  highConversionOnly: boolean;
  lowRefundRiskOnly: boolean;
  sort: Sort;
  q: string;
};

export const NO_FILTER: ResultFilter = {
  maturities: [],
  highConversionOnly: false,
  lowRefundRiskOnly: false,
  sort: "match",
  q: "",
};

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const SORTS: Record<Sort, string> = {
  match: "Melhor aderência",
  compliance: "Maior compliance CONAR",
  engagement: "Maior engajamento",
  sales: "Mais vendas/mês est.",
};

const SHOWN_MATURITIES: Maturity[] = ["recorrente", "em-crescimento", "iniciante"];

export function applyFilter(list: RankedCreator[], f: ResultFilter): RankedCreator[] {
  const terms = norm(f.q).split(/\s+/).filter(Boolean);
  const out = list.filter(({ creator: c }) => {
    const searchable = norm(
      [
        c.name,
        c.handle,
        c.city,
        c.summary,
        c.disclosureNotes,
        ...c.niches.map((n) => `${n} ${NICHE_LABELS[n]}`),
        ...c.channels.map((ch) => `${ch} ${CHANNEL_LABELS[ch]}`),
        ...c.bestFormats,
      ].join(" "),
    );
    return (
      terms.every((t) => searchable.includes(t)) &&
      (f.maturities.length === 0 || f.maturities.includes(c.maturity)) &&
      (!f.highConversionOnly || c.estimatedConversionTier === "alto") &&
      (!f.lowRefundRiskOnly || c.refundOrChargebackRisk === "baixo")
    );
  });

  if (f.sort === "compliance") {
    out.sort((a, b) => b.creator.adComplianceScore - a.creator.adComplianceScore || b.score - a.score);
  } else if (f.sort === "engagement") {
    out.sort((a, b) => b.creator.engagementRate - a.creator.engagementRate || b.score - a.score);
  } else if (f.sort === "sales") {
    out.sort((a, b) => b.creator.avgMonthlySales - a.creator.avgMonthlySales || b.score - a.score);
  }

  return out;
}

const chip = (on: boolean) =>
  `flex items-center gap-1.5 rounded-full border px-3 py-1 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600 ${
    on
      ? "border-foreground bg-foreground text-background"
      : "border-line bg-card hover:border-foreground/40"
  }`;

export function SortSelect({
  filter,
  onChange,
}: {
  filter: ResultFilter;
  onChange: (f: ResultFilter) => void;
}) {
  return (
    <label className="flex shrink-0 items-center gap-2 text-sm text-muted">
      Ordenar por
      <select
        id="sort"
        value={filter.sort}
        onChange={(e) => onChange({ ...filter, sort: e.target.value as Sort })}
        className="rounded-full border border-line bg-card px-3 py-1 text-foreground"
      >
        {(Object.keys(SORTS) as Sort[]).map((s) => (
          <option key={s} value={s}>
            {SORTS[s]}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function ResultsBar({
  filter,
  onChange,
  counts,
  highConversionCount,
  lowRefundCount,
}: {
  filter: ResultFilter;
  onChange: (f: ResultFilter) => void;
  counts: Record<Maturity, number>;
  highConversionCount: number;
  lowRefundCount: number;
}) {
  const toggleMaturity = (m: Maturity) =>
    onChange({
      ...filter,
      maturities: filter.maturities.includes(m)
        ? filter.maturities.filter((x) => x !== m)
        : [...filter.maturities, m],
    });

  return (
    <div className="space-y-3">
      <input
        id="search"
        type="search"
        value={filter.q}
        onChange={(e) => onChange({ ...filter, q: e.target.value })}
        placeholder="Buscar por nome, @handle, nicho, formato ou cidade"
        aria-label="Buscar creators"
        className="w-full rounded-full border border-line bg-card px-4 py-2 text-sm placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600"
      />
      <div
        className="flex flex-wrap items-center gap-2 text-[13px]"
        role="group"
        aria-label="Refinar resultados"
      >
        <span className="mr-1 text-muted">Refinar:</span>
        {SHOWN_MATURITIES.filter((m) => counts[m] > 0).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={filter.maturities.includes(m)}
            onClick={() => toggleMaturity(m)}
            className={chip(filter.maturities.includes(m))}
          >
            <span className={`h-2 w-2 rounded-full ${MATURITY_LABELS[m].toneDot}`} />
            {MATURITY_LABELS[m].label}
            <span className="tabular-nums opacity-70">{counts[m]}</span>
          </button>
        ))}
        <button
          type="button"
          aria-pressed={filter.highConversionOnly}
          onClick={() => onChange({ ...filter, highConversionOnly: !filter.highConversionOnly })}
          className={chip(filter.highConversionOnly)}
        >
          {filter.highConversionOnly ? "✓ " : ""}Conversão alta
          <span className="tabular-nums opacity-70">{highConversionCount}</span>
        </button>
        <button
          type="button"
          aria-pressed={filter.lowRefundRiskOnly}
          onClick={() => onChange({ ...filter, lowRefundRiskOnly: !filter.lowRefundRiskOnly })}
          className={chip(filter.lowRefundRiskOnly)}
        >
          {filter.lowRefundRiskOnly ? "✓ " : ""}Risco baixo de estorno
          <span className="tabular-nums opacity-70">{lowRefundCount}</span>
        </button>
      </div>
    </div>
  );
}
