import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "../lib/cn";

export function PrivacyHelper() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-3">
      <button
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-coral"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        Como isso funciona?
        <ChevronDown className={cn("transition", open && "rotate-180")} size={16} />
      </button>
      {open ? (
        <div className="mt-3 rounded-lg bg-white/62 p-4 text-sm leading-6 text-cocoa/72 ring-1 ring-cocoa/8">
          <p className="font-semibold text-ink">Sem servidores no caminho</p>
          <p className="mt-1">
            O Falaí roda direto no seu navegador. Sua chave é usada apenas para abrir uma
            conexão direta com a OpenAI. Não temos backend, não salvamos sua chave e não enviamos
            suas conversas para servidores próprios.
          </p>
          <p className="mt-3">
            Recomendamos usar uma chave específica para este app, com limites adequados na sua
            conta da OpenAI.
          </p>
        </div>
      ) : null}
    </div>
  );
}
