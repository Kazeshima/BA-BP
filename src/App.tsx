import { LoaderCircle, RefreshCw, TriangleAlert } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Toaster, toast } from "sonner";
import { ArchiveDrawer } from "./components/ArchiveDrawer";
import { BanBar } from "./components/BanBar";
import { type DialogName, Header } from "./components/Header";
import { ResetDialog } from "./components/ResetDialog";
import { Roster } from "./components/Roster";
import { Scoreboard } from "./components/Scoreboard";
import { SettingsDialog } from "./components/SettingsDialog";
import { SpecialPanel } from "./components/SpecialPanel";
import { TeamPanel } from "./components/TeamPanel";
import { DndRoot } from "./dnd/DndRoot";
import { useShortcuts } from "./hooks/useShortcuts";
import { t as translate, useT } from "./i18n";
import { isTauri, openExternal } from "./lib/platform";
import { checkForUpdate, RELEASES_URL } from "./lib/update";
import { useRoster } from "./store/roster";
import { resolveTheme, useSettings } from "./store/settings";

function useThemeSync() {
  const theme = useSettings((s) => s.theme);
  useEffect(() => {
    const apply = () => {
      document.documentElement.dataset.theme = resolveTheme(theme);
    };
    apply();
    if (theme !== "system") return;
    const mq = matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [theme]);
  const locale = useSettings((s) => s.locale);
  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
  }, [locale]);
}

function useUpdateCheck() {
  useEffect(() => {
    if (!isTauri) return;
    void checkForUpdate(__APP_VERSION__).then((version) => {
      if (!version) return;
      toast(translate("update.available", { version }), {
        duration: 15000,
        action: { label: translate("update.download"), onClick: () => void openExternal(RELEASES_URL) },
      });
    });
  }, []);
}

function Splash() {
  const t = useT();
  const { status, error, load } = useRoster();
  const nameLang = useSettings((s) => s.nameLang);
  return (
    <div className="grid h-full place-items-center p-6">
      {status === "error" ? (
        <div className="panel flex max-w-md flex-col items-center gap-3 px-8 py-7 text-center">
          <TriangleAlert className="text-ban" size={36} />
          <h1 className="font-bold text-xl">{t("loadError.title")}</h1>
          <p className="text-muted">{t("loadError.body")}</p>
          <code className="rounded bg-surface-3 px-2 py-0.5 font-mono text-subtle text-xs">{error}</code>
          <button
            type="button"
            className="btn btn-primary mt-2"
            onClick={() => void load(nameLang, { force: true })}
          >
            <RefreshCw />
            {t("common.retry")}
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 text-muted">
          <LoaderCircle className="animate-spin text-brand" size={36} />
          <span className="font-semibold tracking-widest">{t("loading")}</span>
        </div>
      )}
    </div>
  );
}

export function App() {
  const status = useRoster((s) => s.status);
  const nameLang = useSettings((s) => s.nameLang);
  const [dialog, setDialog] = useState<DialogName>(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const closeDialog = useCallback(() => setDialog(null), []);
  const closeArchive = useCallback(() => setArchiveOpen(false), []);

  useThemeSync();
  useShortcuts();
  useUpdateCheck();

  useEffect(() => {
    void useRoster.getState().load(nameLang);
  }, [nameLang]);

  const theme = useSettings((s) => resolveTheme(s.theme));

  return (
    <>
      {status !== "ready" ? (
        <Splash />
      ) : (
        <DndRoot>
          <div className="mx-auto flex h-full max-w-[1920px] flex-col gap-2 p-2">
            <Header onOpen={setDialog} onToggleArchive={() => setArchiveOpen((v) => !v)} />
            <BanBar />
            <div className="flex min-h-0 flex-1 gap-2">
              <SpecialPanel />
              <Roster />
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-2">
              <TeamPanel side="attacker" />
              <Scoreboard />
              <TeamPanel side="defender" />
            </div>
          </div>
          <ArchiveDrawer open={archiveOpen} onClose={closeArchive} />
        </DndRoot>
      )}
      <SettingsDialog open={dialog === "settings"} onClose={closeDialog} />
      <ResetDialog
        kind={dialog === "fullReset" || dialog === "roundReset" ? dialog : null}
        onClose={closeDialog}
      />
      <Toaster theme={theme} position="top-center" richColors closeButton offset={64} />
    </>
  );
}
