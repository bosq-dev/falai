import type { Language } from "./language";

export type AppState =
  | "needsApiKey"
  | "ready"
  | "connecting"
  | "live"
  | "listening"
  | "finishingTranslation"
  | "translating"
  | "error";

export type DialState =
  | "idle"
  | "dragging"
  | "switching"
  | "listening"
  | "finishingTranslation"
  | "translating"
  | "error";

export type TranscriptChannel = "original" | "translation";

export type TranscriptDelta = {
  channel: TranscriptChannel;
  text: string;
};

export type RealtimeDirection = {
  sourceLanguage: Language;
  targetLanguage: Language;
};

export type RealtimeStatus =
  | "connecting"
  | "connected"
  | "listening"
  | "translating"
  | "closed"
  | "error";

export type RealtimeFriendlyErrorCode =
  | "microphone"
  | "invalid-key"
  | "browser-blocked"
  | "openai-unavailable"
  | "unsupported-browser"
  | "unknown";

export class RealtimeFriendlyError extends Error {
  code: RealtimeFriendlyErrorCode;
  friendlyMessage: string;

  constructor(code: RealtimeFriendlyErrorCode, friendlyMessage: string) {
    super(friendlyMessage);
    this.name = "RealtimeFriendlyError";
    this.code = code;
    this.friendlyMessage = friendlyMessage;
  }
}

export type RealtimeSession = {
  stop: () => void;
};
