import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { CashService, type CashMovementKind, type CutSummary } from "../api/cashService";
import CloseCutModal from "../components/cash/CloseCutModal";
import MovementModal from "../components/cash/MovementModal";
import PageHeader from "../components/PageHeader";
import { formatMoney, parseDate } from "../lib/format";
import { btnGhost, btnPrimary, btnSecondary, inputClass, tableCell, tableHead } from "../lib/ui";

const movementLabels: Record<CashMovementKind, string> = {
  ingreso: "Ingreso",
  retiro: "Retiro",
  devolucion: "Devolución",
};

function formatDateTime(value: string) {
  return parseDate(value).toLocaleString([], {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function Cash() {
  const { t } = useTranslation();
  const [current, setCurrent] = useState<CutSummary | null>(null);
  const [history, setHistory] = useState<CutSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openingFund, setOpeningFund] = useState("");
  const [lastClosed, setLastClosed] = useState<CutSummary | null>(null);
  const [suggestedFund, setSuggestedFund] = useState<number | null>(null);
  const [showMovement, setShowMovement] = useState(false);
  const [showClose, setShowClose] = useState(false);

  const load = async () => {
    try {
      const [summary, closed, fund] = await Promise.all([
        CashService.getCurrent(),
        CashService.history(),
        CashService.suggestedFund(),
      ]);
      setCurrent(summary);
      setHistory(closed);
      setSuggestedFund(fund);
      setError(null);
      window.dispatchEvent(new Event("cash-changed"));
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!current && suggestedFund !== null && openingFund === "") {
      setOpeningFund(String(suggestedFund));
    }
  }, [suggestedFund, current]);

  const handleOpen = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await CashService.open(Number(openingFund) || 0);
      setOpeningFund("");
      setLastClosed(null);
      await load();
    } catch (err) {
      setError(String(err));
    }
  };

  const handleClosed = async (result: CutSummary) => {
    setShowClose(false);
    setLastClosed(result);
    await load();
  };

  if (loading) {
    return (
      <>
        <PageHeader title={t("Corte de caja")} />
        <p className="py-16 text-center text-sm text-muted">{t("Cargando...")}</p>
      </>
    );
  }

  if (!current) {
    return (
      <>
        <PageHeader
          title={t("Corte de caja")}
          description={t("La caja está cerrada")}
        />

        {lastClosed && (
          <div className="mb-8 rounded-lg border border-line bg-surface px-5 py-4">
            <p className="text-sm font-medium">{t("Corte final realizado")}</p>
            <p className="mt-1 text-sm text-muted">
              {t("Ventas del turno")}: {formatMoney(lastClosed.total_sales)} ·{" "}
              {(() => {
                const diff = lastClosed.session.difference ?? 0;
                if (Math.abs(diff) < 0.005) return t("Cuadra");
                return `${diff > 0 ? t("Sobra") : t("Falta")} ${formatMoney(Math.abs(diff))}`;
              })()}
            </p>
          </div>
        )}

        <form
          onSubmit={handleOpen}
          className="max-w-sm rounded-lg border border-line bg-surface p-6"
        >
          <h2 className="text-base font-semibold">{t("Abrir caja")}</h2>
          <p className="mt-1 mb-5 text-sm text-muted">
            {t("Cuenta el efectivo inicial con el que das cambio durante el turno.")}
          </p>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">
              {t("Fondo inicial")}
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={openingFund}
              onChange={(e) => setOpeningFund(e.target.value)}
              className={`${inputClass} tabular-nums`}
              placeholder="0.00"
            />
            {suggestedFund !== null && (
              <span className="mt-1.5 block text-xs text-muted">
                {t("Fondo que quedó en caja en el último corte final")}
              </span>
            )}
          </label>

          {error && (
            <p role="alert" className="mt-4 text-sm text-danger">
              {error}
            </p>
          )}

          <button type="submit" className={`${btnPrimary} mt-5 h-10 w-full`}>
            {t("Abrir caja")}
          </button>
        </form>

        <HistorySection history={history} />
      </>
    );
  }

  const { session } = current;

  return (
    <>
      <PageHeader
        title={t("Corte de caja")}
        description={`${t("Caja abierta desde")} ${formatDateTime(session.opened_at)} · ${t("Fondo inicial")} ${formatMoney(session.opening_fund)}`}
        actions={
          <>
            <button onClick={() => setShowMovement(true)} className={btnSecondary}>
              {t("Registrar movimiento")}
            </button>
            <button onClick={() => setShowClose(true)} className={btnPrimary}>
              {t("Corte final")}
            </button>
          </>
        }
      />

      {error && (
        <p role="alert" className="mb-6 text-sm text-danger">
          {error}
        </p>
      )}

      <section>
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold">{t("Corte parcial")}</h2>
            <p className="mt-0.5 text-sm text-muted">
              {t("Consulta del turno. No cierra la caja ni reinicia los totales.")}
            </p>
          </div>
          <button onClick={load} className={btnGhost}>
            {t("Actualizar")}
          </button>
        </div>

        <table className="w-full border-y border-line">
          <thead>
            <tr className="border-b border-line">
              <th className={tableHead}>{t("Método de pago")}</th>
              <th className={`${tableHead} text-right`}>{t("Total")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            <tr>
              <td className={tableCell}>{t("Efectivo")}</td>
              <td className={`${tableCell} text-right tabular-nums`}>
                {formatMoney(current.cash_sales)}
              </td>
            </tr>
            <tr>
              <td className={tableCell}>{t("Tarjeta")}</td>
              <td className={`${tableCell} text-right tabular-nums`}>
                {formatMoney(current.card_sales)}
              </td>
            </tr>
            <tr>
              <td className={tableCell}>{t("Transferencia")}</td>
              <td className={`${tableCell} text-right tabular-nums`}>
                {formatMoney(current.transfer_sales)}
              </td>
            </tr>
            <tr className="font-medium">
              <td className={tableCell}>
                {t("Total de ventas")}{" "}
                <span className="font-normal text-muted">
                  ({current.sales_count} {t("ventas")})
                </span>
              </td>
              <td className={`${tableCell} text-right tabular-nums`}>
                {formatMoney(current.total_sales)}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-base font-semibold">{t("Efectivo esperado")}</h2>
        <dl className="max-w-md space-y-2 text-sm">
          <Row label={t("Fondo inicial")} value={formatMoney(session.opening_fund)} />
          <Row label={t("+ Ventas en efectivo")} value={formatMoney(current.cash_sales)} />
          <Row label={t("+ Ingresos")} value={formatMoney(current.cash_in)} />
          <Row label={t("− Retiros")} value={formatMoney(current.withdrawals)} />
          <Row label={t("− Devoluciones")} value={formatMoney(current.refunds)} />
          <div className="flex justify-between border-t border-line pt-3 text-base font-semibold">
            <dt>{t("Efectivo esperado")}</dt>
            <dd className="tabular-nums">{formatMoney(current.expected_cash)}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-base font-semibold">{t("Movimientos del turno")}</h2>
        {current.movements.length === 0 ? (
          <p className="text-sm text-muted">{t("Sin movimientos en este turno")}</p>
        ) : (
          <table className="w-full border-y border-line">
            <thead>
              <tr className="border-b border-line">
                <th className={tableHead}>{t("Hora")}</th>
                <th className={tableHead}>{t("Tipo")}</th>
                <th className={tableHead}>{t("Concepto")}</th>
                <th className={tableHead}>{t("Comprobante")}</th>
                <th className={`${tableHead} text-right`}>{t("Monto")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {current.movements.map((movement) => (
                <tr key={movement.id}>
                  <td className={`${tableCell} text-muted tabular-nums`}>
                    {formatDateTime(movement.created_at)}
                  </td>
                  <td className={tableCell}>{t(movementLabels[movement.kind])}</td>
                  <td className={tableCell}>{movement.concept}</td>
                  <td className={`${tableCell} text-muted`}>
                    {movement.reference || "—"}
                  </td>
                  <td className={`${tableCell} text-right tabular-nums`}>
                    {movement.kind === "ingreso" ? "+" : "−"}
                    {formatMoney(movement.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <HistorySection history={history} />

      <MovementModal
        isOpen={showMovement}
        onClose={() => setShowMovement(false)}
        onSaved={load}
      />

      <CloseCutModal
        isOpen={showClose}
        onClose={() => setShowClose(false)}
        summary={current}
        onClosed={handleClosed}
      />
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}

function HistorySection({ history }: { history: CutSummary[] }) {
  const { t } = useTranslation();

  return (
    <section className="mt-10">
      <h2 className="mb-3 text-base font-semibold">{t("Cortes finales anteriores")}</h2>
      {history.length === 0 ? (
        <p className="text-sm text-muted">{t("Todavía no hay cortes finales")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-y border-line">
            <thead>
              <tr className="border-b border-line">
                <th className={tableHead}>{t("Cierre")}</th>
                <th className={`${tableHead} text-right`}>{t("Ventas")}</th>
                <th className={`${tableHead} text-right`}>{t("Esperado")}</th>
                <th className={`${tableHead} text-right`}>{t("Contado")}</th>
                <th className={`${tableHead} text-right`}>{t("Diferencia")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {history.map((cut) => {
                const diff = cut.session.difference ?? 0;
                const off = Math.abs(diff) >= 0.005;
                return (
                  <tr key={cut.session.id}>
                    <td className={`${tableCell} text-muted tabular-nums`}>
                      {cut.session.closed_at && formatDateTime(cut.session.closed_at)}
                    </td>
                    <td className={`${tableCell} text-right tabular-nums`}>
                      {formatMoney(cut.total_sales)}
                    </td>
                    <td className={`${tableCell} text-right tabular-nums`}>
                      {formatMoney(cut.session.expected_cash ?? 0)}
                    </td>
                    <td className={`${tableCell} text-right tabular-nums`}>
                      {formatMoney(cut.session.counted_cash ?? 0)}
                    </td>
                    <td
                      className={`${tableCell} text-right tabular-nums ${
                        off ? "text-danger" : "text-muted"
                      }`}
                    >
                      {off
                        ? `${diff > 0 ? "+" : "−"}${formatMoney(Math.abs(diff))}`
                        : t("Cuadra")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
