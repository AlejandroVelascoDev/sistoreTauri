import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { CashService, type CashMovementKind } from "../../api/cashService";
import Modal from "../Modal";
import Segmented from "../Segmented";
import { btnPrimary, btnSecondary, inputClass } from "../../lib/ui";

const emptyForm = {
  kind: "retiro" as CashMovementKind,
  amount: "",
  concept: "",
  reference: "",
};

export default function MovementModal({
  isOpen,
  onClose,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(emptyForm);
      setError(null);
    }
  }, [isOpen]);

  const update = <K extends keyof typeof emptyForm>(
    field: K,
    value: (typeof emptyForm)[K]
  ) => setForm((current) => ({ ...current, [field]: value }));

  const kindOptions: { value: CashMovementKind; label: string }[] = [
    { value: "retiro", label: t("Retiro") },
    { value: "devolucion", label: t("Devolución") },
    { value: "ingreso", label: t("Ingreso") },
  ];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await CashService.createMovement({
        kind: form.kind,
        amount: Number(form.amount),
        concept: form.concept,
        reference: form.reference,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t("Registrar movimiento")}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <span className="mb-1.5 block text-sm font-medium">{t("Tipo")}</span>
          <Segmented
            value={form.kind}
            options={kindOptions}
            onChange={(value) => update("kind", value)}
            className="w-full"
          />
        </div>

        <Field label={t("Monto")}>
          <input
            type="number"
            required
            min="0.01"
            step="0.01"
            value={form.amount}
            onChange={(e) => update("amount", e.target.value)}
            className={`${inputClass} tabular-nums`}
          />
        </Field>

        <Field label={t("Concepto")}>
          <input
            type="text"
            required
            autoFocus
            placeholder={t("Ej: Pago a proveedor de bebidas")}
            value={form.concept}
            onChange={(e) => update("concept", e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label={t("Comprobante (opcional)")}>
          <input
            type="text"
            placeholder={t("Ej: Factura 0456")}
            value={form.reference}
            onChange={(e) => update("reference", e.target.value)}
            className={inputClass}
          />
        </Field>

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className={btnSecondary}>
            {t("Cancelar")}
          </button>
          <button type="submit" disabled={submitting} className={btnPrimary}>
            {t("Registrar")}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}
