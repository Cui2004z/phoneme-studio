"use client";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
type Preferences = {
  theme: "light" | "dark";
  compact: boolean;
  name: string;
  studentNumber: string;
  videoUrl: string;
};
const defaults: Preferences = {
  theme: "light",
  compact: false,
  name: "Samuel Karanja",
  studentNumber: "22301707",
  videoUrl: "",
};
const preferenceEvent = "phoneme-preferences-change";
function cookieSnapshot() {
  return (
    document.cookie
      .split("; ")
      .find((row) => row.startsWith("phoneme-preferences="))
      ?.slice("phoneme-preferences=".length) ?? ""
  );
}
function serverSnapshot() {
  return "";
}
function subscribe(listener: () => void) {
  window.addEventListener(preferenceEvent, listener);
  window.addEventListener("focus", listener);
  return () => {
    window.removeEventListener(preferenceEvent, listener);
    window.removeEventListener("focus", listener);
  };
}
function parsePreferences(saved: string): Preferences {
  try {
    const p = JSON.parse(decodeURIComponent(saved));
    return {
      theme: p.theme === "dark" ? "dark" : "light",
      compact: p.compact === true,
      name:
        typeof p.name === "string" && p.name.trim() ? p.name : defaults.name,
      studentNumber:
        typeof p.studentNumber === "string" && p.studentNumber.trim()
          ? p.studentNumber
          : defaults.studentNumber,
      videoUrl: typeof p.videoUrl === "string" ? p.videoUrl : "",
    };
  } catch {
    return defaults;
  }
}
const Context = createContext<{
  preferences: Preferences;
  update: (value: Partial<Preferences>) => void;
}>({ preferences: defaults, update: () => {} });
export function StudioProvider({ children }: { children: ReactNode }) {
  const saved = useSyncExternalStore(subscribe, cookieSnapshot, serverSnapshot);
  const preferences = useMemo(() => parsePreferences(saved), [saved]);
  useEffect(() => {
    document.documentElement.classList.toggle(
      "dark",
      preferences.theme === "dark",
    );
    document.documentElement.classList.toggle("compact", preferences.compact);
  }, [preferences]);
  function update(value: Partial<Preferences>) {
    const next = { ...parsePreferences(cookieSnapshot()), ...value };
    document.cookie = `phoneme-preferences=${encodeURIComponent(JSON.stringify(next))}; Path=/; Max-Age=31536000; SameSite=Lax`;
    window.dispatchEvent(new Event(preferenceEvent));
  }
  return (
    <Context.Provider value={{ preferences, update }}>
      <TooltipProvider delayDuration={180}>
        {children}
        <Toaster position="bottom-right" theme={preferences.theme} />
      </TooltipProvider>
    </Context.Provider>
  );
}
export function usePreferences() {
  return useContext(Context);
}
