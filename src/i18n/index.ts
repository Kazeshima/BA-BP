import { useCallback } from "react";
import { useSettings } from "../store/settings";
import { en } from "./en";
import type { Locale } from "./locale";
import { type MessageKey, zh } from "./zh";

export { detectLocale } from "./locale";
export type { Locale, MessageKey };

const dictionaries: Record<Locale, Record<MessageKey, string>> = { zh, en };

export type Vars = Record<string, string | number>;

export function translate(locale: Locale, key: MessageKey, vars?: Vars): string {
  const template = dictionaries[locale][key] ?? zh[key] ?? key;
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (m, name: string) => (name in vars ? String(vars[name]) : m));
}

export function useT() {
  const locale = useSettings((s) => s.locale);
  return useCallback((key: MessageKey, vars?: Vars) => translate(locale, key, vars), [locale]);
}

/** Non-hook access for event handlers outside React render. */
export const t = (key: MessageKey, vars?: Vars) => translate(useSettings.getState().locale, key, vars);
