export const REALTIME_TRANSLATION_MODELS = [
  {
    id: "gpt-realtime-translate",
    label: "GPT Realtime Translate",
    description: "Tradução speech-to-speech em tempo real",
  },
] as const;

export type RealtimeTranslationModelId = (typeof REALTIME_TRANSLATION_MODELS)[number]["id"];

export const DEFAULT_REALTIME_TRANSLATION_MODEL: RealtimeTranslationModelId =
  REALTIME_TRANSLATION_MODELS[0].id;
