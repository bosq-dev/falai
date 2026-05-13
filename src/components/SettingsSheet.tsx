import { ChevronDown, KeyRound, Languages, LockKeyhole } from "lucide-react";
import { REALTIME_TRANSLATION_MODELS } from "../lib/realtimeModels";
import { BottomSheet } from "./BottomSheet";
import { PrivacyHelper } from "./PrivacyHelper";

type SettingsSheetProps = {
  open: boolean;
  apiKey: string;
  disabled?: boolean;
  onClose: () => void;
  onApiKeyChange: (value: string) => void;
  onOpenLanguages: () => void;
};

export function SettingsSheet({
  open,
  apiKey,
  disabled,
  onClose,
  onApiKeyChange,
  onOpenLanguages,
}: SettingsSheetProps) {
  const model = REALTIME_TRANSLATION_MODELS[0];

  return (
    <BottomSheet open={open} title="Configurações" onClose={onClose}>
      <div className="grid ">
        <section>
          <label className="text-sm font-semibold text-ink" htmlFor="openai-key">
            Chave da OpenAI
          </label>
          <div className="relative mt-2">
            <KeyRound className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-cocoa/42" size={18} />
            <input
              autoComplete="off"
              className="h-12 w-full rounded-2xl border border-cocoa/10 bg-white/78 py-3 pl-11 pr-4 text-base text-ink outline-none transition placeholder:text-cocoa/34 focus:border-coral/45 focus:ring-4 focus:ring-coral/12 disabled:opacity-55"
              disabled={disabled}
              id="openai-key"
              onChange={(event) => onApiKeyChange(event.target.value)}
              placeholder="sk-..."
              spellCheck={false}
              type="password"
              value={apiKey}
            />
          </div>
          <p className="mt-2 text-sm leading-6 text-cocoa/62">
            Sua chave fica somente neste navegador. Ela é usada para conectar direto à OpenAI e
            não é salva.
          </p>
        </section>

        <section >
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-white">
              <LockKeyhole size={17} />
            </span>
            <div>
              <div className="relative inline-flex">
                <select
                  className="h-10 appearance-none rounded-full bg-cream py-1.5 pl-3 pr-9 font-mono text-xs font-semibold text-cocoa outline-none ring-1 ring-cocoa/8"
                  onChange={() => undefined}
                  value={model.id}
                >
                  {REALTIME_TRANSLATION_MODELS.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.id}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-cocoa/56"
                  size={15}
                />
              </div>
              <p className="mt-2 text-sm leading-6 text-cocoa/62">
                Modelo da OpenAI para tradução de voz em tempo real.
              </p>
            </div>
          </div>
        </section>
          <PrivacyHelper />
      </div>
    </BottomSheet>
  );
}
