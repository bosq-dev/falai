import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Repeat2 } from "lucide-react";
import { useState } from "react";
import type { Language, LanguageSide } from "../types/language";
import { cn } from "../lib/cn";

type LanguagePickerSheetProps = {
  open: boolean;
  languages: Language[];
  leftLanguage: Language;
  rightLanguage: Language;
  disabled?: boolean;
  onClose: () => void;
  onChangeLanguage: (side: LanguageSide, language: Language) => void;
  onSwap: () => void;
};

export function LanguagePickerSheet({
  open,
  languages,
  leftLanguage,
  rightLanguage,
  disabled,
  onClose,
  onChangeLanguage,
  onSwap,
}: LanguagePickerSheetProps) {
  const [openDropdown, setOpenDropdown] = useState<LanguageSide | null>("left");

  function selectLanguage(side: LanguageSide, language: Language) {
    const otherLanguage = side === "left" ? rightLanguage : leftLanguage;

    if (language.id === otherLanguage.id) {
      return;
    }

    onChangeLanguage(side, language);
    setOpenDropdown(null);
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="relative z-30 mx-auto mt-3 w-full max-w-xl px-5"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.16, ease: "easeOut" }}
        >
          <div className="border-y border-white/10 py-4">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-semibold text-white">Idiomas da conversa</p>
              <button
                className="rounded-full px-3 py-1.5 text-xs font-semibold text-white/62 transition active:bg-white/8"
                onClick={onClose}
                type="button"
              >
                Fechar
              </button>
            </div>

            <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-start gap-2">
              <LanguageDropdown
                side="left"
                disabled={disabled}
                label="Um lado do disco"
                languages={languages}
                blockedId={rightLanguage.id}
                open={openDropdown === "left"}
                selectedLanguage={leftLanguage}
                onOpenChange={(nextOpen) => setOpenDropdown(nextOpen ? "left" : null)}
                onChange={(language) => selectLanguage("left", language)}
              />
              <div className="flex justify-center pt-6">
                <button
                  aria-label="Inverter idiomas"
                  className="grid h-10 w-10 place-items-center rounded-full bg-white text-black shadow-sm transition active:scale-[0.96] disabled:opacity-50"
                  disabled={disabled}
                  onClick={onSwap}
                  type="button"
                >
                  <Repeat2 size={16} />
                </button>
              </div>
              <LanguageDropdown
                side="right"
                disabled={disabled}
                label="Outro lado do disco"
                languages={languages}
                blockedId={leftLanguage.id}
                open={openDropdown === "right"}
                selectedLanguage={rightLanguage}
                onOpenChange={(nextOpen) => setOpenDropdown(nextOpen ? "right" : null)}
                onChange={(language) => selectLanguage("right", language)}
              />
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function LanguageDropdown({
  side,
  label,
  selectedLanguage,
  languages,
  blockedId,
  disabled,
  open,
  onOpenChange,
  onChange,
}: {
  side: LanguageSide;
  label: string;
  selectedLanguage: Language;
  languages: Language[];
  blockedId: string;
  disabled?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (language: Language) => void;
}) {
  return (
    <section className="relative min-w-0">
      <p className="mb-2 truncate text-[0.68rem] font-bold uppercase tracking-[0.14em] text-white/42">
        {label}
      </p>
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex h-12 w-full min-w-0 items-center justify-between gap-2 rounded-2xl border border-white/12 bg-white/8 px-3 text-left text-sm font-semibold text-white transition active:scale-[0.98] disabled:opacity-50"
        disabled={disabled}
        onClick={() => onOpenChange(!open)}
        type="button"
      >
        <span className="truncate">{selectedLanguage.label}</span>
        <ChevronDown className={cn("shrink-0 text-white/58 transition", open && "rotate-180")} size={16} />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            className={cn(
              "absolute z-40 mt-2 w-[min(17rem,calc(100vw-2.5rem))] overflow-hidden rounded-2xl border border-white/12 bg-zinc-950 shadow-2xl",
              side === "right" ? "right-0" : "left-0",
            )}
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.14, ease: "easeOut" }}
            role="listbox"
          >
            <div className="max-h-64 overflow-y-auto p-1.5">
              {languages.map((language) => {
                const isSelected = language.id === selectedLanguage.id;
                const isBlocked = language.id === blockedId;

                return (
                  <button
                    aria-selected={isSelected}
                    className={cn(
                      "flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold text-white transition",
                      isSelected && "bg-white text-black",
                      !isSelected && "hover:bg-white/8",
                      isBlocked && "cursor-not-allowed opacity-30",
                    )}
                    disabled={disabled || isBlocked}
                    key={language.id}
                    onClick={() => onChange(language)}
                    role="option"
                    type="button"
                  >
                    <span className="min-w-0">
                      <span className="block truncate">{language.label}</span>
                      <span className={cn("block truncate text-xs font-medium", isSelected ? "text-black/52" : "text-white/42")}>
                        {language.examplePhrase}
                      </span>
                    </span>
                    {isSelected ? <Check className="shrink-0" size={16} /> : null}
                  </button>
                );
              })}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
