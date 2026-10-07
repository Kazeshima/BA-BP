import { X } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";
import { useT } from "../../i18n";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
}

/** Native <dialog> modal: focus trapping, Esc to close and top-layer rendering for free. */
export function Dialog({ open, onClose, title, children, footer, width = 440 }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const t = useT();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onMouseDown={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="m-auto rounded-2xl border border-line bg-surface p-0 text-fg shadow-float backdrop:bg-[rgb(5_10_20/0.55)] backdrop:backdrop-blur-[2px]"
      style={{ width: `min(${width}px, calc(100vw - 32px))` }}
    >
      {open && (
        <div className="flex max-h-[85vh] flex-col">
          <header className="flex items-center gap-3 border-line border-b px-5 py-3.5">
            <h2 className="font-bold text-lg tracking-wide">{title}</h2>
            <button
              type="button"
              className="btn btn-icon ml-auto border-transparent"
              onClick={onClose}
              aria-label={t("common.close")}
            >
              <X />
            </button>
          </header>
          <div className="overflow-y-auto px-5 py-4">{children}</div>
          {footer && (
            <footer className="flex justify-end gap-2 border-line border-t px-5 py-3">{footer}</footer>
          )}
        </div>
      )}
    </dialog>
  );
}
