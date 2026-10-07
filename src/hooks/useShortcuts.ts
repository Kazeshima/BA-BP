import { useEffect } from "react";
import { toast } from "sonner";
import { t } from "../i18n";
import { toggleFullscreen } from "../lib/platform";
import { useDraft } from "../store/draft";
import { useTimer } from "../store/timer";

const isTyping = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));

export function useShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      if (key === "f11") {
        e.preventDefault();
        void toggleFullscreen();
        return;
      }
      if (document.querySelector("dialog[open]")) return;

      if (mod && key === "z" && !isTyping(e.target)) {
        e.preventDefault();
        const done = e.shiftKey ? useDraft.getState().redo() : useDraft.getState().undo();
        if (done && !e.shiftKey) toast(t("undo.done"), { id: "undo", duration: 1200 });
        return;
      }
      if (mod && key === "y" && !isTyping(e.target)) {
        e.preventDefault();
        useDraft.getState().redo();
        return;
      }
      if (mod && key === "f") {
        e.preventDefault();
        document.querySelector<HTMLInputElement>("#roster-search")?.focus();
        return;
      }
      if (mod || e.altKey || isTyping(e.target)) return;
      if (key === " ") {
        e.preventDefault();
        useTimer.getState().toggle();
      } else if (key === "r") {
        useTimer.getState().reset();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
