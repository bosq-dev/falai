import { DEFAULT_REALTIME_TRANSLATION_MODEL } from "./realtimeModels";
import type { Language } from "../types/language";
import {
  RealtimeFriendlyError,
  type RealtimeSession,
  type RealtimeStatus,
  type TranscriptDelta,
} from "../types/realtime";

const TRANSLATION_CLIENT_SECRET_ENDPOINT =
  "https://api.openai.com/v1/realtime/translations/client_secrets";
const TRANSLATION_CALL_ENDPOINT = "https://api.openai.com/v1/realtime/translations/calls";

// Set to true to log the realtime connection lifecycle to the console for debugging.
const DEBUG_REALTIME = false;
function dbg(...args: unknown[]) {
  if (DEBUG_REALTIME) console.log("[realtime]", ...args);
}

type StartRealtimeTranslationOptions = {
  apiKey: string;
  sourceLanguage: Language;
  targetLanguage: Language;
  audioElement: HTMLAudioElement;
  onStatus?: (status: RealtimeStatus) => void;
  onTranscript?: (delta: TranscriptDelta) => void;
  onInputSpeechStarted?: () => void;
  onInputSpeechStopped?: () => void;
  onOutputActivity?: () => void;
};

type OpenAIClientSecretResponse = {
  value?: string;
  client_secret?: {
    value?: string;
  };
};

export async function startClientOnlyRealtimeTranslation({
  apiKey,
  targetLanguage,
  audioElement,
  onStatus,
  onTranscript,
  onInputSpeechStarted,
  onInputSpeechStopped,
  onOutputActivity,
}: StartRealtimeTranslationOptions): Promise<RealtimeSession> {
  if (!("RTCPeerConnection" in window) || !navigator.mediaDevices?.getUserMedia) {
    throw new RealtimeFriendlyError(
      "unsupported-browser",
      "Este navegador não oferece os recursos de áudio necessários para conversar ao vivo.",
    );
  }

  let sourceStream: MediaStream;
  try {
    sourceStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    dbg("microphone granted, tracks:", sourceStream.getAudioTracks().length);
  } catch (error) {
    dbg("getUserMedia failed", error);
    throw new RealtimeFriendlyError("microphone", "Não conseguimos acessar o microfone.");
  }

  onStatus?.("connecting");

  const pc = new RTCPeerConnection();
  const events = pc.createDataChannel("oai-events");
  let cleanupRemoteAudioMeter: () => void = () => undefined;

  sourceStream.getAudioTracks().forEach((track) => {
    pc.addTrack(track, sourceStream);
  });

  pc.ontrack = ({ receiver, streams }) => {
    const [stream] = streams;
    dbg("remote track received, stream:", Boolean(stream));
    if (stream) {
      audioElement.srcObject = stream;
      audioElement
        .play()
        .then(() => dbg("audioElement.play() ok"))
        .catch((error) => dbg("audioElement.play() rejected", error));
      cleanupRemoteAudioMeter();
      cleanupRemoteAudioMeter = startRemoteAudioActivityMeter(receiver, () => {
        onOutputActivity?.();
      });
    }
  };

  events.addEventListener("message", ({ data }) => {
    const event = parseEvent(data);
    if (!event) return;
    const eventType = typeof event.type === "string" ? event.type : "";

    if (isTranslationOutputEvent(eventType)) {
      onOutputActivity?.();
    }

    if (isSpeechStartedEvent(eventType)) {
      onInputSpeechStarted?.();
    }

    if (isSpeechStoppedEvent(eventType)) {
      onInputSpeechStopped?.();
    }

    if (eventType === "session.input_transcript.delta" && typeof event.delta === "string") {
      onTranscript?.({ channel: "original", text: event.delta });
      return;
    }

    if (eventType === "session.output_transcript.delta" && typeof event.delta === "string") {
      onTranscript?.({ channel: "translation", text: event.delta });
      onStatus?.("translating");
    }

    if (eventType === "error") {
      onStatus?.("error");
    }
  });

  pc.addEventListener("connectionstatechange", () => {
    dbg("connectionState:", pc.connectionState);
    if (pc.connectionState === "connected") {
      onStatus?.("connected");
      onStatus?.("listening");
    }

    if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
      onStatus?.("error");
    }
  });

  try {
    dbg("requesting client secret, target:", targetLanguage.openAIOutputLanguageCode);
    const clientSecret = await createTranslationClientSecret({
      apiKey,
      targetLanguage,
    });
    dbg("client secret obtained");

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const sdpResponse = await fetch(TRANSLATION_CALL_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${clientSecret}`,
        "Content-Type": "application/sdp",
      },
      body: offer.sdp ?? "",
    });
    dbg("SDP /calls response status:", sdpResponse.status);

    if (!sdpResponse.ok) {
      throw await friendlyFromResponse(sdpResponse);
    }

    await pc.setRemoteDescription({
      type: "answer",
      sdp: await sdpResponse.text(),
    });

    return {
      stop: () =>
        stopRealtimeSession(pc, sourceStream, audioElement, cleanupRemoteAudioMeter),
    };
  } catch (error) {
    stopRealtimeSession(pc, sourceStream, audioElement, cleanupRemoteAudioMeter);
    throw normalizeRealtimeError(error);
  }
}

async function createTranslationClientSecret({
  apiKey,
  targetLanguage,
}: {
  apiKey: string;
  targetLanguage: Language;
}) {
  try {
    const response = await fetch(TRANSLATION_CLIENT_SECRET_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session: {
          model: DEFAULT_REALTIME_TRANSLATION_MODEL,
          audio: {
            output: {
              language: targetLanguage.openAIOutputLanguageCode,
            },
          },
        },
      }),
    });

    dbg("client_secrets response status:", response.status);
    if (!response.ok) {
      throw await friendlyFromResponse(response);
    }

    const data = (await response.json()) as OpenAIClientSecretResponse;
    const value = data.value ?? data.client_secret?.value;

    if (!value) {
      throw new RealtimeFriendlyError(
        "openai-unavailable",
        "Não foi possível conectar à OpenAI.",
      );
    }

    return value;
  } catch (error) {
    dbg("createTranslationClientSecret error", error);
    throw normalizeRealtimeError(error);
  }
}

function parseEvent(data: unknown): { type?: string; delta?: unknown } | null {
  if (typeof data !== "string") return null;

  try {
    return JSON.parse(data) as { type?: string; delta?: unknown };
  } catch {
    return null;
  }
}

function isSpeechStartedEvent(eventType: string) {
  return eventType.endsWith("speech_started");
}

function isSpeechStoppedEvent(eventType: string) {
  return eventType.endsWith("speech_stopped");
}

function isTranslationOutputEvent(eventType: string) {
  return (
    eventType.startsWith("session.output_audio.") ||
    eventType.startsWith("session.output_transcript.") ||
    eventType.startsWith("response.output_audio.") ||
    eventType.startsWith("response.output_audio_transcript.") ||
    eventType.startsWith("response.output_text.")
  );
}

function startRemoteAudioActivityMeter(
  receiver: RTCRtpReceiver,
  onOutputActivity: () => void,
) {
  let disposed = false;
  let lastTotalAudioEnergy: number | null = null;
  const meterId = window.setInterval(() => {
    receiver
      .getStats()
      .then((report) => {
        if (disposed) return;

        report.forEach((stats) => {
          const inboundStats = stats as RTCInboundRtpStreamStats & {
            audioLevel?: number;
            totalAudioEnergy?: number;
            kind?: string;
            mediaType?: string;
          };

          if (
            inboundStats.type !== "inbound-rtp" ||
            (inboundStats.kind !== "audio" && inboundStats.mediaType !== "audio")
          ) {
            return;
          }

          if (typeof inboundStats.audioLevel === "number" && inboundStats.audioLevel > 0.01) {
            onOutputActivity();
          }

          if (typeof inboundStats.totalAudioEnergy === "number") {
            if (
              lastTotalAudioEnergy !== null &&
              inboundStats.totalAudioEnergy - lastTotalAudioEnergy > 0.0001
            ) {
              onOutputActivity();
            }

            lastTotalAudioEnergy = inboundStats.totalAudioEnergy;
          }
        });
      })
      .catch(() => undefined);
  }, 120);

  return () => {
    disposed = true;
    window.clearInterval(meterId);
  };
}

function stopRealtimeSession(
  pc: RTCPeerConnection,
  sourceStream: MediaStream,
  audioElement: HTMLAudioElement,
  cleanupRemoteAudioMeter: () => void,
) {
  cleanupRemoteAudioMeter();
  sourceStream.getTracks().forEach((track) => track.stop());
  pc.getSenders().forEach((sender) => sender.track?.stop());
  pc.close();
  audioElement.pause();
  audioElement.srcObject = null;
}

async function friendlyFromResponse(response: Response) {
  if (response.status === 401 || response.status === 403) {
    return new RealtimeFriendlyError("invalid-key", "Verifique sua chave da OpenAI.");
  }

  if (response.status === 404) {
    return new RealtimeFriendlyError(
      "openai-unavailable",
      "Não foi possível conectar à OpenAI.",
    );
  }

  if (response.status >= 400 && response.status < 500) {
    return new RealtimeFriendlyError(
      "browser-blocked",
      "Este modo sem backend depende de conexão direta entre seu navegador e a OpenAI. Se o navegador bloquear a conexão, seria necessária uma versão com servidor próprio — mas esta versão do Falaí não usa backend.",
    );
  }

  return new RealtimeFriendlyError("openai-unavailable", "Não foi possível conectar à OpenAI.");
}

function normalizeRealtimeError(error: unknown) {
  if (error instanceof RealtimeFriendlyError) {
    return error;
  }

  if (error instanceof TypeError) {
    return new RealtimeFriendlyError(
      "browser-blocked",
      "Não foi possível conectar direto à OpenAI pelo navegador. O Falaí não usa servidores próprios, então esta versão depende de suporte direto do navegador.",
    );
  }

  return new RealtimeFriendlyError("unknown", "Algo deu errado.");
}
