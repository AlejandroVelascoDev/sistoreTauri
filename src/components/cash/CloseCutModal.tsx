import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { CashService, type CutSummary } from "../../api/cashService";
import Modal from "../Modal";
import { DENOMINATIONS } from "../../lib/denominations";
import { formatMoney } from "../../lib/format";
import { btnPrimary, btnSecondary, inputClass, tableCell, tableHead } from "../../lib/ui";

export default function CloseCutModal({
  isOpen,
  onClose,
  summary,
  onClosed,
}: {
  isOpen: boolean;
  onClose: () => void;
  summary: CutSummary;
  onClosed: (result: CutSummary) => void;
}) {
  const { t } = useTranslation();
  const [counts, setCounts] = useState<Record<number, string>>({});
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCounts({});
      setNotes("");
      setError(null);
    }
  }, [isOpen]);

  const counted = DENOMINATIONS.reduce(
    (sum, value) => sum + value * (Number(counts[value]) || 0),
    0
  );
  const difference = counted - summary.expected_cash;
  const hasDifference = Math.abs(difference) >= 0.005;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await CashService.close({
        session_id: summary.session.id,
        denominations: DENOMINATIONS.map((value) => ({
          value,
          count: Number(counts[value]) || 0,
        })),
        notes,
      });
      onClosed(result);
    } catch (err) {
      setError(String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("Corte final")}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <p className="text-sm text-muted">
          {t("Cuenta el efectivo del cajón. Al confirmar, la caja se cierra y no podrás registrar más ventas en este turno.")}
        </p>

        <table className="w-full border-y border-line">
          <thead>
            <tr className="border-b border-line">
              <th className={tableHead}>{t("Denominación")}</th>
              <th className={`${tableHead} w-40 text-right`}>{t("Cantidad")}</th>
              <th className={`${tableHead} text-right`}>{t("Subtotal")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {DENOMINATIONS.map((value) => {
              const count = Number(counts[value]) || 0;
              return (
                <tr key={value}>
                  <td className={`${tableCell} tabular-nums`}>
                    {formatMoney(value)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      aria-label={`${t("Cantidad")} ${formatMoney(value)}`}
                      value={counts[value] ?? ""}
                      onChange={(e) =>
                        setCounts((current) => ({
                          ...current,
                          [value]: e.target.value,
                        }))
                      }
                      className={`${inputClass} ml-auto h-8 w-28 text-right tabular-nums`}
                    />
                  </td>
                  <td
                    className={`${tableCell} text-right tabular-nums ${
                      count === 0 ? "text-muted" : ""
                    }`}
                  >
                    {formatMoney(value * count)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <dl className="space-y-2 text-sm">
          <div className="flex justify-between text-muted">
            <dt>{t("Efectivo esperado")}</dt>
            <dd className="tabular-nums">{formatMoney(summary.expected_cash)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="font-medium">{t("Efectivo contado")}</dt>
            <dd className="font-medium tabular-nums">{formatMoney(counted)}</dd>
          </div>
          <div
            className={`flex justify-between border-t border-line pt-2 ${
              hasDifference ? "text-danger" : "text-muted"
            }`}
          >
            <dt className="font-medium">
              {!hasDifference
                ? t("Cuadra")
                : difference > 0
                ? t("Sobra")
                : t("Falta")}
            </dt>
            <dd className="font-semibold tabular-nums">
              {formatMoney(Math.abs(difference))}
            </dd>
          </div>
        </dl>

        {hasDifference && (
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">
              {t("Explica la diferencia")}
            </span>
            <textarea
              required
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("Ej: Error al dar cambio en la venta de la tarde")}
              className={`${inputClass} h-auto resize-none py-2`}
            />
          </label>
        )}

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={btnSecondary}>
            {t("Cancelar")}
          </button>
          <button type="submit" disabled={submitting} className={btnPrimary}>
            {t("Realizar corte final")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
