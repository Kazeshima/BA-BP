import { ExternalLink, RefreshCw } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { useT } from "../i18n";
import { openExternal } from "../lib/platform";
import { NAME_LANG_LABELS, NAME_LANGS, type NameLang, SERVERS, type Server } from "../lib/schaledb";
import { RELEASES_URL } from "../lib/update";
import { useDraft } from "../store/draft";
import { useRoster } from "../store/roster";
import { type Theme, useSettings } from "../store/settings";
import { MAX_SHARED_BANS, MAX_SIDE_BANS } from "../types";
import { Dialog } from "./ui/Dialog";

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="min-w-0">
        <div className="font-semibold text-sm">{label}</div>
        {hint && <div className="text-subtle text-xs">{hint}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-line bg-surface-2 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={`rounded-md px-3 py-1 font-bold text-[13px] transition-colors ${
            o.value === value ? "bg-brand text-brand-fg shadow" : "text-muted hover:text-fg"
          }`}
          onClick={() => onChange(o.value)}
          aria-pressed={o.value === value}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Number input that only commits on blur/Enter, so typing "12" doesn't resize to 1 first. */
function CountInput({ value, max, onCommit }: { value: number; max: number; onCommit: (n: number) => void }) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);
  return (
    <input
      type="number"
      min={0}
      max={max}
      className="input w-20 text-center font-mono"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => onCommit(Number(text))}
      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
    />
  );
}

const SHORTCUTS: [string, Parameters<ReturnType<typeof useT>>[0]][] = [
  ["Space", "shortcut.timer"],
  ["R", "shortcut.timerReset"],
  ["Ctrl+Z", "shortcut.undo"],
  ["Ctrl+Shift+Z", "shortcut.redo"],
  ["Ctrl+F", "shortcut.search"],
  ["F11", "shortcut.fullscreen"],
];

export function SettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();
  const s = useSettings();
  const { status, updatedAt, load } = useRoster();
  const setBanCounts = useDraft((d) => d.setBanCounts);

  return (
    <Dialog open={open} onClose={onClose} title={t("settings.title")} width={520}>
      <div className="divide-y divide-line">
        <Row label={t("settings.uiLang")}>
          <Segmented
            value={s.locale}
            options={[
              { value: "zh", label: "中文" },
              { value: "en", label: "English" },
            ]}
            onChange={(v) => s.set("locale", v)}
          />
        </Row>
        <Row label={t("settings.theme")}>
          <Segmented<Theme>
            value={s.theme}
            options={[
              { value: "system", label: t("settings.theme.system") },
              { value: "light", label: t("settings.theme.light") },
              { value: "dark", label: t("settings.theme.dark") },
            ]}
            onChange={(v) => s.set("theme", v)}
          />
        </Row>
        <Row label={t("settings.nameLang")}>
          <select
            className="input select w-40"
            value={s.nameLang}
            onChange={(e) => s.set("nameLang", e.target.value as NameLang)}
          >
            {NAME_LANGS.map((l) => (
              <option key={l} value={l}>
                {NAME_LANG_LABELS[l]}
              </option>
            ))}
          </select>
        </Row>
        <Row label={t("settings.server")}>
          <Segmented<Server>
            value={s.server}
            options={SERVERS.map((v) => ({ value: v, label: t(`settings.server.${v}`) }))}
            onChange={(v) => s.set("server", v)}
          />
        </Row>
        <Row label={t("settings.sideBans")} hint={t("settings.sharedBansHint", { max: MAX_SIDE_BANS })}>
          <CountInput
            value={s.sideBanCount}
            max={MAX_SIDE_BANS}
            onCommit={(n) => setBanCounts(n, s.sharedBanCount)}
          />
        </Row>
        <Row label={t("settings.sharedBans")} hint={t("settings.sharedBansHint", { max: MAX_SHARED_BANS })}>
          <CountInput
            value={s.sharedBanCount}
            max={MAX_SHARED_BANS}
            onCommit={(n) => setBanCounts(s.sideBanCount, n)}
          />
        </Row>
        <Row label={t("settings.sound")}>
          <input
            type="checkbox"
            className="size-5 accent-[var(--brand)]"
            checked={s.sound}
            onChange={(e) => s.set("sound", e.target.checked)}
          />
        </Row>
        <Row
          label={t("settings.data")}
          hint={
            updatedAt ? t("settings.dataUpdated", { time: new Date(updatedAt).toLocaleString() }) : undefined
          }
        >
          <button
            type="button"
            className="btn"
            disabled={status === "loading"}
            onClick={() => void load(s.nameLang, { force: true })}
          >
            <RefreshCw className={status === "loading" ? "animate-spin" : ""} />
            {t("settings.refresh")}
          </button>
        </Row>

        <div className="py-3">
          <div className="mb-2 font-semibold text-sm">{t("settings.shortcuts")}</div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
            {SHORTCUTS.map(([key, label]) => (
              <div key={key} className="flex items-center justify-between gap-2 text-muted text-sm">
                <span>{t(label)}</span>
                <span className="kbd">{key}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-subtle text-xs">
            {s.locale === "zh"
              ? "右键槽位可快速清空；拖动槽位中的学生回到列表即可移除。"
              : "Right-click a slot to clear it, or drag its student back onto the roster."}
          </p>
        </div>

        <div className="flex items-center justify-between py-3 text-muted text-xs">
          <span>
            {t("settings.version", { version: __APP_VERSION__ })} · Data:{" "}
            <button
              type="button"
              className="underline"
              onClick={() => void openExternal("https://schaledb.com")}
            >
              SchaleDB
            </button>
          </span>
          <button type="button" className="btn h-7 text-xs" onClick={() => void openExternal(RELEASES_URL)}>
            <ExternalLink />
            GitHub
          </button>
        </div>
      </div>
    </Dialog>
  );
}
