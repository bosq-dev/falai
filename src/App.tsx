import { useEffect, useMemo, useRef, useState } from "react";
import { Settings } from "lucide-react";
import { AppHeader } from "./components/AppHeader";
import { ConversationDial } from "./components/ConversationDial";
import { LanguagePairChip } from "./components/LanguagePairChip";
import { LanguagePickerSheet } from "./components/LanguagePickerSheet";
import { SettingsSheet } from "./components/SettingsSheet";
import { LANGUAGES, getLanguageById } from "./lib/languages";
import { useMemoryApiKey } from "./lib/keyMemory";
import { startClientOnlyRealtimeTranslation } from "./lib/openaiClientOnlyRealtime";
import type { Language, LanguageSide } from "./types/language";
import { RealtimeFriendlyError, type AppState, type DialState, type RealtimeSession } from "./types/realtime";

const OUTPUT_DRAIN_QUIET_MS = 1600;
const OUTPUT_DRAIN_CHECK_MS = 120;

export default function App() {
  const { apiKey, setApiKey } = useMemoryApiKey();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const realtimeRef = useRef<RealtimeSession | null>(null);
  const outputDrainTimerRef = useRef<number | null>(null);
  const appStateRef = useRef<AppState>("needsApiKey");
  const runIdRef = useRef(0);
  const isSessionActiveRef = useRef(false);
  const lastOutputAtRef = useRef(0);
  const finishingStartedAtRef = useRef(0);
  const stopAfterOutputDrainRef = useRef(false);

  const [leftLanguage, setLeftLanguage] = useState(() => getLanguageById("pt"));
  const [rightLanguage, setRightLanguage] = useState(() => getLanguageById("en"));
  const [activeSide, setActiveSide] = useState<LanguageSide>("left");
  const [appState, setAppState] = useState<AppState>("needsApiKey");
  const [dialState, setDialState] = useState<DialState>("idle");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [languagesOpen, setLanguagesOpen] = useState(false);
  const [lastFriendlyError, setLastFriendlyError] = useState("");

  const hasApiKey = apiKey.trim().length > 0;
  const isLocked =
    appState === "connecting" ||
    appState === "live" ||
    appState === "listening" ||
    appState === "finishingTranslation" ||
    appState === "translating";

  const activeLanguage = activeSide === "left" ? leftLanguage : rightLanguage;
  const otherLanguage = activeSide === "left" ? rightLanguage : leftLanguage;

  const directionLabel = useMemo(() => {
    return `${activeLanguage.label} → ${otherLanguage.label}`;
  }, [activeLanguage.label, otherLanguage.label]);

  useEffect(() => {
    appStateRef.current = appState;
  }, [appState]);

  useEffect(() => {
    return () => {
      if (outputDrainTimerRef.current) {
        window.clearTimeout(outputDrainTimerRef.current);
      }

      realtimeRef.current?.stop();
    };
  }, []);

  function setSessionState(nextAppState: AppState, nextDialState: DialState) {
    appStateRef.current = nextAppState;
    setAppState(nextAppState);
    setDialState(nextDialState);
  }

  function syncReadyState(nextHasApiKey = hasApiKey) {
    if (nextHasApiKey) {
      setSessionState("ready", "idle");
      return;
    }

    setSessionState("needsApiKey", "idle");
  }

  function clearOutputDrainTimer() {
    if (outputDrainTimerRef.current) {
      window.clearTimeout(outputDrainTimerRef.current);
      outputDrainTimerRef.current = null;
    }
  }

  function stopRealtime() {
    clearOutputDrainTimer();
    stopAfterOutputDrainRef.current = false;
    finishingStartedAtRef.current = 0;
    lastOutputAtRef.current = 0;
    realtimeRef.current?.stop();
    realtimeRef.current = null;
  }

  function markOutputActivity() {
    lastOutputAtRef.current = Date.now();

    if (appStateRef.current === "finishingTranslation") {
      scheduleOutputDrain();
    }
  }

  function enterFinishingTranslation(stopAfterDrain: boolean) {
    if (stopAfterDrain) {
      stopAfterOutputDrainRef.current = true;
    }

    const now = Date.now();
    finishingStartedAtRef.current = now;

    if (!lastOutputAtRef.current) {
      lastOutputAtRef.current = now;
    }

    setSessionState("finishingTranslation", "finishingTranslation");
    scheduleOutputDrain();
  }

  function scheduleOutputDrain() {
    clearOutputDrainTimer();

    const quietBaseline = Math.max(lastOutputAtRef.current, finishingStartedAtRef.current);
    const quietFor = Date.now() - quietBaseline;
    const waitMs = Math.max(OUTPUT_DRAIN_QUIET_MS - quietFor, OUTPUT_DRAIN_CHECK_MS);

    outputDrainTimerRef.current = window.setTimeout(finishOutputDrainIfQuiet, waitMs);
  }

  function finishOutputDrainIfQuiet() {
    outputDrainTimerRef.current = null;

    const quietBaseline = Math.max(lastOutputAtRef.current, finishingStartedAtRef.current);
    const quietFor = Date.now() - quietBaseline;

    if (quietFor < OUTPUT_DRAIN_QUIET_MS) {
      scheduleOutputDrain();
      return;
    }

    if (stopAfterOutputDrainRef.current || !isSessionActiveRef.current) {
      runIdRef.current += 1;
      stopRealtime();
      syncReadyState(hasApiKey);
      return;
    }

    finishingStartedAtRef.current = 0;
    setSessionState("listening", "listening");
  }

  function resumeListeningAfterInputStarts() {
    if (!isSessionActiveRef.current) return;

    clearOutputDrainTimer();
    finishingStartedAtRef.current = 0;
    stopAfterOutputDrainRef.current = false;
    setSessionState("listening", "listening");
  }

  function handleToggle() {
    if (!hasApiKey) {
      setSettingsOpen(true);
      setSessionState("needsApiKey", "idle");
      return;
    }

    // A tap while a session is active stops it (draining any in-flight translation first).
    if (isLocked) {
      stopSession();
      return;
    }

    void startSession();
  }

  function stopSession() {
    isSessionActiveRef.current = false;

    if (appState === "connecting" && !realtimeRef.current) {
      runIdRef.current += 1;
      stopRealtime();
      syncReadyState(hasApiKey);
      return;
    }

    enterFinishingTranslation(true);
  }

  async function startSession() {
    if (!audioRef.current) return;

    const runId = runIdRef.current + 1;
    runIdRef.current = runId;
    isSessionActiveRef.current = true;
    setLastFriendlyError("");
    setSessionState("connecting", "listening");

    try {
      const session = await startClientOnlyRealtimeTranslation({
        apiKey: apiKey.trim(),
        sourceLanguage: activeLanguage,
        targetLanguage: otherLanguage,
        audioElement: audioRef.current,
        onStatus: (status) => {
          if (runIdRef.current !== runId) return;

          if (status === "connected" || status === "listening") {
            if (appStateRef.current !== "finishingTranslation") {
              setSessionState("listening", "listening");
            }
          }

          if (status === "translating") {
            if (appStateRef.current !== "finishingTranslation") {
              setSessionState("translating", "translating");
            }
          }

          if (status === "error") {
            runIdRef.current += 1;
            stopRealtime();
            setSessionState("error", "error");
          }
        },
        onInputSpeechStarted: () => {
          if (runIdRef.current !== runId) return;
          resumeListeningAfterInputStarts();
        },
        onInputSpeechStopped: () => {
          if (runIdRef.current !== runId) return;
          enterFinishingTranslation(false);
        },
        onOutputActivity: () => {
          if (runIdRef.current !== runId) return;
          markOutputActivity();
        },
      });

      if (runIdRef.current !== runId || !isSessionActiveRef.current) {
        session.stop();
        return;
      }

      realtimeRef.current = session;
    } catch (error) {
      if (runIdRef.current !== runId) return;

      const friendlyMessage =
        error instanceof RealtimeFriendlyError ? error.friendlyMessage : "Algo deu errado";
      setLastFriendlyError(friendlyMessage);
      setSessionState("error", "error");
    }
  }

  function handleSwitchActiveLanguage() {
    if (isLocked) return;
    setDialState("switching");
    setActiveSide((side) => (side === "left" ? "right" : "left"));
    window.setTimeout(() => setDialState("idle"), 220);
  }

  function handleSwapLanguages() {
    if (isLocked) return;
    setLeftLanguage(rightLanguage);
    setRightLanguage(leftLanguage);
    setActiveSide((side) => (side === "left" ? "right" : "left"));
  }

  function handleChangeLanguage(side: LanguageSide, language: Language) {
    if (isLocked) return;

    if (side === "left") {
      setLeftLanguage(language);
    } else {
      setRightLanguage(language);
    }
  }

  function handleApiKeyChange(value: string) {
    if (isLocked) return;
    setApiKey(value);
    syncReadyState(value.trim().length > 0);
  }

  function handleRetry() {
    runIdRef.current += 1;
    stopRealtime();
    setLastFriendlyError("");
    syncReadyState(hasApiKey);
  }

  return (
    <main className="min-h-dvh overflow-hidden bg-black text-white">
      <div className="relative mx-auto flex min-h-dvh w-full max-w-4xl flex-col pb-[max(1.2rem,env(safe-area-inset-bottom))]">
        <AppHeader state={appState} />
        <LanguagePairChip
          disabled={isLocked}
          leftLanguage={leftLanguage}
          onOpen={() => setLanguagesOpen(true)}
          onSwap={handleSwapLanguages}
          rightLanguage={rightLanguage}
        />
        <LanguagePickerSheet
          disabled={isLocked}
          languages={LANGUAGES}
          leftLanguage={leftLanguage}
          onChangeLanguage={handleChangeLanguage}
          onClose={() => setLanguagesOpen(false)}
          onSwap={handleSwapLanguages}
          open={languagesOpen}
          rightLanguage={rightLanguage}
        />

        {!hasApiKey ? (
          <section className="mx-auto mt-5 flex w-full max-w-xl items-center justify-between gap-3 px-5">
            <p className="text-sm font-semibold text-white/62">Adicione sua chave da OpenAI para começar.</p>
            <button
              className="h-10 shrink-0 rounded-full bg-white px-4 text-sm font-semibold text-black shadow-sm"
              onClick={() => setSettingsOpen(true)}
              type="button"
            >
              Configurar chave
            </button>
          </section>
        ) : null}

        <ConversationDial
          activeLanguage={activeLanguage}
          dialState={dialState}
          disabled={false}
          onRetry={handleRetry}
          onSwitch={handleSwitchActiveLanguage}
          onToggle={handleToggle}
          otherLanguage={otherLanguage}
        />

        <section className="mx-auto mt-5 w-full max-w-xl px-5 text-center">
          <p className="text-base font-semibold text-white">
            {dialState === "listening"
              ? `Ouvindo ${activeLanguage.label}...`
              : dialState === "finishingTranslation"
                ? "Finalizando tradução..."
                : dialState === "translating"
                  ? `Traduzindo para ${otherLanguage.label}...`
                  : "Toque para falar"}
          </p>
          <p className="mt-1 text-sm font-medium text-white/48">Arraste para trocar idioma</p>
          <p className="mt-3 inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white shadow-sm ring-1 ring-white/12">
            {directionLabel}
          </p>
        </section>

        {lastFriendlyError ? (
          <p className="mx-auto mt-3 max-w-xl px-7 text-center text-sm leading-6 text-white/62">
            {lastFriendlyError}
          </p>
        ) : null}

        <div className="mt-auto flex justify-center px-5 pt-4">
          <button
            className="inline-flex h-11 items-center gap-2 rounded-full bg-white/10 px-4 text-sm font-semibold text-white shadow-sm ring-1 ring-white/12 backdrop-blur transition active:scale-[0.98]"
            onClick={() => setSettingsOpen(true)}
            type="button"
          >
            <Settings size={17} />
            Configurações
          </button>
        </div>
      </div>

      <audio ref={audioRef} autoPlay playsInline className="hidden" />

      <SettingsSheet
        apiKey={apiKey}
        disabled={isLocked}
        onApiKeyChange={handleApiKeyChange}
        onClose={() => setSettingsOpen(false)}
        onOpenLanguages={() => {
          setSettingsOpen(false);
          setLanguagesOpen(true);
        }}
        open={settingsOpen}
      />
    </main>
  );
}
