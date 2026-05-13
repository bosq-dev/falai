import { ArrowLeftRight, ChevronDown, Repeat2 } from "lucide-react";
import type { Language } from "../types/language";

type LanguagePairChipProps = {
  leftLanguage: Language;
  rightLanguage: Language;
  disabled?: boolean;
  onOpen: () => void;
  onSwap: () => void;
};

export function LanguagePairChip({
  leftLanguage,
  rightLanguage,
  disabled,
  onOpen,
  onSwap,
}: LanguagePairChipProps) {
  return (
    <div className="mx-auto mt-5 flex w-full max-w-xl items-center justify-center gap-2 px-5">
      <button
        className="inline-flex min-h-12 max-w-full items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-white/12 backdrop-blur-md transition active:scale-[0.98] disabled:opacity-60"
        disabled={disabled}
        onClick={onOpen}
        type="button"
      >
        <span className="truncate">{leftLanguage.label}</span>
        <ArrowLeftRight size={16} className="shrink-0 text-saffron" />
        <span className="truncate">{rightLanguage.label}</span>
        <ChevronDown size={16} className="shrink-0 text-white/60" />
      </button>
      <button
        aria-label="Inverter idiomas"
        className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white/10 text-white shadow-sm ring-1 ring-white/12 backdrop-blur-md transition active:scale-[0.96] disabled:opacity-60"
        disabled={disabled}
        onClick={onSwap}
        type="button"
      >
        <Repeat2 size={18} />
      </button>
    </div>
  );
}
