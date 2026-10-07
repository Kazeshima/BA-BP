import { useT } from "../i18n";
import { useDraft } from "../store/draft";
import { useTimer } from "../store/timer";
import { Dialog } from "./ui/Dialog";

export function ResetDialog({
  kind,
  onClose,
}: {
  kind: "fullReset" | "roundReset" | null;
  onClose: () => void;
}) {
  const t = useT();
  const full = kind === "fullReset";

  const confirm = () => {
    if (full) {
      useDraft.getState().fullReset();
      useTimer.getState().reset();
    } else {
      useDraft.getState().roundReset();
    }
    onClose();
  };

  return (
    <Dialog
      open={kind != null}
      onClose={onClose}
      title={full ? t("reset.full.title") : t("reset.round.title")}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>
            {t("common.cancel")}
          </button>
          <button
            type="button"
            className={full ? "btn btn-danger-solid" : "btn btn-primary"}
            onClick={confirm}
            // biome-ignore lint/a11y/noAutofocus: confirm dialogs should focus the primary action
            autoFocus
          >
            {full ? t("reset.full.confirm") : t("reset.round.confirm")}
          </button>
        </>
      }
    >
      <p className="text-muted leading-relaxed">{full ? t("reset.full.body") : t("reset.round.body")}</p>
    </Dialog>
  );
}
