import type { AppState } from "../types/realtime";

type AppHeaderProps = {
  state: AppState;
};

const STATUS_COPY: Record<AppState, string> = {
  needsApiKey: "Sem chave",
  ready: "Pronto",
  connecting: "Conectando",
  live: "Ao vivo",
  listening: "Ouvindo",
  finishingTranslation: "Finalizando",
  translating: "Traduzindo",
  error: "Erro",
};

export function AppHeader({ state }: AppHeaderProps) {
  return (
    <header className="mx-auto flex w-full max-w-xl items-start justify-between gap-4 px-5 pt-5">
      <div>
        <p className="text-3xl font-bold tracking-normal text-white">Falaí</p>
        <p className="mt-1 max-w-[17rem] text-sm leading-5 text-white/62">
          Tradução ao vivo para conversas sem fronteira.
        </p>
      </div>
      <p className="shrink-0 pt-2 text-right text-xs font-semibold uppercase tracking-[0.14em] text-white/48">
        {STATUS_COPY[state]}
      </p>
    </header>
  );
}
