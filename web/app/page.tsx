"use client";
// Home: FilterPanel (left) + ranked creators & AI explain (right). Deterministic ranking runs in the browser.
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import DoorCard from "@/components/DoorCard";
import FilterPanel from "@/components/FilterPanel";
import ResultsBar, {
  NO_FILTER,
  SortSelect,
  applyFilter,
  type ResultFilter,
} from "@/components/ResultsBar";
import { rankCreators } from "@/lib/match";
import { EMPTY_PROFILE, loadProfile, saveProfile } from "@/lib/profile-store";
import type {
  Campaign,
  CampaignFilterProfile,
  Creator,
  Maturity,
} from "@/lib/types";

const PAGE = 12;

const DEFAULT_PROFILE: CampaignFilterProfile = {
  ...EMPTY_PROFILE,
  campaignId: "serum-vitamina-c-glowlab",
};

export default function Home() {
  const [creators, setCreators] = useState<Creator[] | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [profile, setProfile] = useState<CampaignFilterProfile>(DEFAULT_PROFILE);
  const [filter, setFilter] = useState<ResultFilter>(NO_FILTER);
  const [shown, setShown] = useState(PAGE);

  useEffect(() => {
    const saved = loadProfile();
    const hasSaved =
      saved.campaignId !== null ||
      saved.niches.length > 0 ||
      saved.channels.length > 0 ||
      saved.maturities.length > 0 ||
      saved.minComplianceScore > 0 ||
      saved.maxRefundRisk !== "any";
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser storage only exists after mount; reading it here keeps the server HTML identical
    if (hasSaved) setProfile(saved);
    else saveProfile(DEFAULT_PROFILE);

    Promise.all([
      fetch("/data/creators.json").then((r) => r.json()),
      fetch("/data/campaigns.json").then((r) => r.json()),
    ])
      .then(([cr, cp]) => {
        setCreators(cr);
        setCampaigns(cp);
      })
      .catch(() => setCreators([]));
  }, []);

  function changeProfile(next: CampaignFilterProfile) {
    setProfile(next);
    saveProfile(next);
    setShown(PAGE);
  }

  const activeCampaign = useMemo(
    () => campaigns.find((c) => c.id === profile.campaignId) ?? null,
    [campaigns, profile.campaignId],
  );

  const ranked = useMemo(
    () => (creators ? rankCreators(creators, profile, activeCampaign) : []),
    [creators, profile, activeCampaign],
  );

  const list = useMemo(() => applyFilter(ranked, filter), [ranked, filter]);

  const counts = useMemo(() => {
    const c: Record<Maturity, number> = {
      recorrente: 0,
      "em-crescimento": 0,
      iniciante: 0,
    };
    for (const item of ranked) c[item.creator.maturity]++;
    return c;
  }, [ranked]);

  const highConversionCount = useMemo(
    () => ranked.filter((item) => item.creator.estimatedConversionTier === "alto").length,
    [ranked],
  );

  const lowRefundCount = useMemo(
    () => ranked.filter((item) => item.creator.refundOrChargebackRisk === "baixo").length,
    [ranked],
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <nav className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <span className="flex items-center gap-3.5">
          <Image
            src="/logo.svg"
            alt="Logo YouShop Creator Match"
            width={56}
            height={56}
            className="rounded-2xl"
            priority
          />
          <span>
            <span className="block font-display text-2xl font-bold tracking-tight sm:text-3xl">
              YouShop Creator Match
            </span>
            <span className="block text-xs text-muted">
              Desafio de Inovação · Programa de Estágio YouShop 2027
            </span>
          </span>
        </span>
        <span className="rounded-full border border-line bg-card px-3 py-1 text-xs text-muted">
          Catálogo simulado · Curadoria híbrida (regras + Gemini)
        </span>
      </nav>

      <header className="mb-10 max-w-4xl space-y-3">
        <h1 className="text-3xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">
          Conecte cada campanha aos{" "}
          <span className="text-emerald-600 dark:text-emerald-400">creators certos</span> com
          aderência e transparência
        </h1>
        <p className="text-base leading-relaxed text-foreground/85 sm:text-lg">
          Filtre por nicho, canal, maturidade, risco de estorno e conformidade CONAR em milissegundos,
          e gere explicações e briefings sob medida com Gemini direto no servidor.
        </p>
      </header>

      <div className="grid gap-8 md:grid-cols-[18rem_1fr] md:gap-10">
        <aside className="md:sticky md:top-6 md:max-h-[calc(100dvh-3rem)] md:self-start md:overflow-y-auto md:pr-2">
          <FilterPanel campaigns={campaigns} profile={profile} onChange={changeProfile} />
        </aside>

        <main className="min-w-0 space-y-4">
          {creators === null ? (
            <p className="text-muted">Carregando catálogo de creators…</p>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h2 className="min-w-0 flex-1 pt-1 text-sm text-muted">
                  {ranked.length > 0 ? (
                    <>
                      <span className="font-semibold text-foreground">
                        {ranked.length === 1
                          ? "1 creator compatível"
                          : `${ranked.length} creators compatíveis`}
                      </span>
                      , entre {creators.length} perfis simulados
                      {activeCampaign && ` para ${activeCampaign.name}`}
                      {list.length !== ranked.length && ` · ${list.length} após refino`}
                    </>
                  ) : (
                    "Nenhum creator atende a todos os critérios atuais"
                  )}
                </h2>
                {ranked.length > 1 && (
                  <SortSelect
                    filter={filter}
                    onChange={(f) => {
                      setFilter(f);
                      setShown(PAGE);
                    }}
                  />
                )}
              </div>

              {ranked.length > 0 && (
                <ResultsBar
                  filter={filter}
                  counts={counts}
                  highConversionCount={highConversionCount}
                  lowRefundCount={lowRefundCount}
                  onChange={(f) => {
                    setFilter(f);
                    setShown(PAGE);
                  }}
                />
              )}

              {ranked.length === 0 && (
                <div className="space-y-3 rounded-xl border border-dashed border-line p-5 text-sm text-muted">
                  <p>
                    Nenhum creator combinou com essa seleção simultânea de campanha, nichos, canais e
                    compliance mínimo.
                  </p>
                  <button
                    type="button"
                    onClick={() => changeProfile(EMPTY_PROFILE)}
                    className="rounded-full border border-line bg-card px-3 py-1 text-xs font-medium text-foreground hover:border-foreground/40"
                  >
                    Voltar para exploração livre
                  </button>
                </div>
              )}

              {ranked.length > 0 && list.length === 0 && (
                <p className="rounded-xl border border-dashed border-line p-5 text-sm text-muted">
                  Nenhum creator encontrado para essa busca ou chips de refino. Tente limpar a busca.
                </p>
              )}

              {list.slice(0, shown).map((rankedItem) => (
                <DoorCard
                  key={rankedItem.creator.id}
                  ranked={rankedItem}
                  profile={profile}
                  campaign={activeCampaign}
                />
              ))}

              {list.length > shown && (
                <button
                  type="button"
                  onClick={() => setShown((n) => n + PAGE)}
                  className="w-full rounded-xl border border-line bg-card py-3 text-sm font-medium hover:bg-foreground/5"
                >
                  Mostrar mais {Math.min(PAGE, list.length - shown)} de {list.length - shown}
                </button>
              )}
            </>
          )}
        </main>
      </div>

      <footer className="mt-16 border-t border-line pt-5 text-xs leading-relaxed text-muted">
        <strong>YouShop Creator Match (MVP)</strong> — Protótipo desenvolvido para o Desafio de
        Inovação do Programa de Estágio YouShop 2027. Perfis e métricas são simulados para fins de
        demonstração; decisões comerciais exigem revisão humana e validação contratual de transparência
        publicitária (CONAR / #publi).
      </footer>
    </div>
  );
}
