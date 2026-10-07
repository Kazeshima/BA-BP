import {
  Archive,
  Maximize,
  Moon,
  Redo2,
  RotateCcw,
  Settings,
  SkipForward,
  Sparkles,
  Star,
  Sun,
  Undo2,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";
import { t as translate, useT } from "../i18n";
import { toggleFullscreen } from "../lib/platform";
import { useDraft } from "../store/draft";
import { useRoster } from "../store/roster";
import { resolveTheme, useSettings } from "../store/settings";

export type DialogName = "settings" | "fullReset" | "roundReset" | null;

function Logo() {
  return (
    <svg viewBox="0 0 32 32" className="size-8 shrink-0" aria-hidden>
      <ellipse cx="16" cy="9" rx="11" ry="4.2" fill="none" stroke="var(--brand)" strokeWidth="2.6" />
      <path d="M8 15h16l-3 13H11z" fill="var(--brand)" opacity="0.9" />
      <path d="M12.5 19h7l-1 5h-5z" fill="var(--surface)" />
    </svg>
  );
}

export function Header({
  onOpen,
  onToggleArchive,
}: {
  onOpen: (d: DialogName) => void;
  onToggleArchive: () => void;
}) {
  const t = useT();
  const releaseMode = useDraft((s) => s.releaseMode);
  const canUndo = useDraft((s) => s.past.length > 0);
  const canRedo = useDraft((s) => s.future.length > 0);
  const theme = useSettings((s) => s.theme);
  const locale = useSettings((s) => s.locale);
  const specialOpen = useSettings((s) => s.specialPanelOpen);
  const archiveCount = useSettings((s) => s.archivedIds.length);
  const stale = useRoster((s) => s.stale);

  const toggleRelease = () => {
    const blocking = useDraft.getState().toggleRelease();
    if (blocking) {
      const name = useRoster.getState().byId.get(blocking.id)?.name ?? String(blocking.id);
      toast.error(translate("release.blocked", { reason: translate(`reason.${blocking.code}`, { name }) }), {
        id: "release",
      });
    } else if (releaseMode) {
      toast.success(translate("release.exited"), { id: "release", duration: 1500 });
    }
  };

  const dark = resolveTheme(theme) === "dark";

  return (
    <header className="panel flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2">
      <div className="mr-2 flex items-center gap-2">
        <Logo />
        <div className="leading-none">
          <div className="font-bold text-[19px] uppercase tracking-[0.12em]">
            BA <span className="text-brand">Draft</span>
          </div>
          <div className="mt-0.5 text-[11px] text-muted tracking-wide">{t("app.subtitle")}</div>
        </div>
        {stale && (
          <span
            className="ml-2 flex items-center gap-1 rounded-full bg-gold/15 px-2 py-0.5 font-semibold text-gold text-xs"
            title={t("offline")}
          >
            <WifiOff size={12} /> Offline
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          className="btn btn-icon"
          onClick={() => useDraft.getState().undo()}
          disabled={!canUndo}
          title={`${t("header.undo")} (Ctrl+Z)`}
          aria-label={t("header.undo")}
        >
          <Undo2 />
        </button>
        <button
          type="button"
          className="btn btn-icon"
          onClick={() => useDraft.getState().redo()}
          disabled={!canRedo}
          title={`${t("header.redo")} (Ctrl+Shift+Z)`}
          aria-label={t("header.redo")}
        >
          <Redo2 />
        </button>
      </div>

      <div className="ml-auto flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          className="btn btn-release"
          data-active={releaseMode}
          onClick={toggleRelease}
          title={releaseMode ? t("header.release.hintOn") : t("header.release.hintOff")}
        >
          <Sparkles />
          {releaseMode ? t("header.release.on") : t("header.release")}
        </button>
        <button
          type="button"
          className="btn"
          data-active={specialOpen}
          onClick={() => useSettings.getState().set("specialPanelOpen", !specialOpen)}
        >
          <Star />
          {t("header.special")}
        </button>
        <button type="button" className="btn" onClick={onToggleArchive}>
          <Archive />
          {t("header.archive")}
          {archiveCount > 0 && (
            <span className="rounded-full bg-surface-3 px-1.5 font-mono text-[11px] text-muted">
              {archiveCount}
            </span>
          )}
        </button>

        <span className="mx-1 h-6 w-px bg-line" aria-hidden />

        <button
          type="button"
          className="btn"
          onClick={() => onOpen("roundReset")}
          title={t("reset.round.body")}
        >
          <SkipForward />
          {t("header.roundReset")}
        </button>
        <button type="button" className="btn btn-danger" onClick={() => onOpen("fullReset")}>
          <RotateCcw />
          {t("header.fullReset")}
        </button>

        <span className="mx-1 h-6 w-px bg-line" aria-hidden />

        <button
          type="button"
          className="btn btn-icon"
          onClick={() => useSettings.getState().set("locale", locale === "zh" ? "en" : "zh")}
          title={t("settings.uiLang")}
          aria-label={t("settings.uiLang")}
        >
          <span className="font-bold text-[13px]">{locale === "zh" ? "EN" : "中"}</span>
        </button>
        <button
          type="button"
          className="btn btn-icon"
          onClick={() => useSettings.getState().set("theme", dark ? "light" : "dark")}
          title={t("header.theme")}
          aria-label={t("header.theme")}
        >
          {dark ? <Sun /> : <Moon />}
        </button>
        <button
          type="button"
          className="btn btn-icon"
          onClick={() => void toggleFullscreen()}
          title={`${t("header.fullscreen")} (F11)`}
          aria-label={t("header.fullscreen")}
        >
          <Maximize />
        </button>
        <button
          type="button"
          className="btn btn-icon"
          onClick={() => onOpen("settings")}
          title={t("header.settings")}
          aria-label={t("header.settings")}
        >
          <Settings />
        </button>
      </div>
    </header>
  );
}
