import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { btnGhost } from "../lib/ui";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "md" | "lg";
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
}: ModalProps) {
  const { t } = useTranslation();

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const root = dialogRef.current!;
    root.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
      if (e.key !== "Tab") return;
      const elements = Array.from(root.querySelectorAll<HTMLElement>(
        'button, input, select, textarea, a[href], [tabindex]'
      )).filter((el) => el.tabIndex >= 0 && !el.matches(":disabled") && el.getClientRects().length > 0);
      const index = elements.indexOf(document.activeElement as HTMLElement);
      e.preventDefault();
      if (!elements.length) root.focus();
      else elements[index < 0 ? (e.shiftKey ? elements.length - 1 : 0) : (index + (e.shiftKey ? -1 : 1) + elements.length) % elements.length].focus();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="anim-fade fixed inset-0 z-50 flex items-center justify-center bg-ink/20 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`anim-modal flex max-h-[90vh] w-full flex-col rounded-lg border border-line bg-surface ${
          size === "lg" ? "max-w-lg" : "max-w-md"
        }`}
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="text-base font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("Cerrar")}
            className={`${btnGhost} h-8 w-8 px-0`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>,
    document.body
  );
}
