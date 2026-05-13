import { useCallback, useEffect, useState } from "react";

let memoryApiKey = "";
const subscribers = new Set<(value: string) => void>();

function emit(value: string) {
  subscribers.forEach((subscriber) => subscriber(value));
}

export function getMemoryApiKey() {
  return memoryApiKey;
}

export function setMemoryApiKey(value: string) {
  memoryApiKey = value;
  emit(memoryApiKey);
}

export function clearMemoryApiKey() {
  memoryApiKey = "";
  emit(memoryApiKey);
}

export function useMemoryApiKey() {
  const [apiKey, setApiKeyState] = useState(memoryApiKey);

  useEffect(() => {
    subscribers.add(setApiKeyState);
    return () => {
      subscribers.delete(setApiKeyState);
    };
  }, []);

  useEffect(() => {
    const clear = () => {
      memoryApiKey = "";
    };

    window.addEventListener("pagehide", clear);
    window.addEventListener("beforeunload", clear);

    return () => {
      window.removeEventListener("pagehide", clear);
      window.removeEventListener("beforeunload", clear);
    };
  }, []);

  const setApiKey = useCallback((value: string) => {
    setMemoryApiKey(value);
  }, []);

  const clearApiKey = useCallback(() => {
    clearMemoryApiKey();
  }, []);

  return { apiKey, setApiKey, clearApiKey };
}
