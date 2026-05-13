import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { Language } from "../types/language";
import { cn } from "../lib/cn";

type LanguageSelectListProps = {
  languages: Language[];
  selectedId: string;
  blockedId: string;
  onSelect: (language: Language) => void;
};

export function LanguageSelectList({
  languages,
  selectedId,
  blockedId,
  onSelect,
}: LanguageSelectListProps) {
  const [query, setQuery] = useState("");

  const filteredLanguages = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return languages;

    return languages.filter((language) => {
      return `${language.label} ${language.nativeLabel} ${language.shortName}`.toLowerCase().includes(normalizedQuery);
    });
  }, [languages, query]);

  return (
    <div>
      <label className="relative block">
        <span className="sr-only">Buscar idioma</span>
        <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-cocoa/42" size={18} />
        <input
          className="h-12 w-full rounded-2xl border border-cocoa/10 bg-white/74 pl-11 pr-4 text-base text-ink outline-none transition placeholder:text-cocoa/36 focus:border-coral/45 focus:ring-4 focus:ring-coral/12"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar idioma"
          value={query}
        />
      </label>
      <div className="mt-4 grid gap-2">
        {filteredLanguages.map((language) => {
          const isSelected = language.id === selectedId;
          const isBlocked = language.id === blockedId;

          return (
            <button
              className={cn(
                "flex min-h-16 items-center justify-between gap-3 rounded-lg bg-white/62 px-4 py-3 text-left shadow-sm ring-1 ring-cocoa/8 transition active:scale-[0.99]",
                isSelected && "ring-2 ring-coral/50",
                isBlocked && "opacity-45",
              )}
              disabled={isBlocked}
              key={language.id}
              onClick={() => onSelect(language)}
              type="button"
            >
              <div>
                <p className="font-semibold text-ink">{language.label}</p>
                <p className="text-sm text-cocoa/56">{language.examplePhrase}</p>
              </div>
              <span
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-xs font-bold text-white shadow-sm"
                style={{ background: language.gradient }}
              >
                {language.shortName}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
