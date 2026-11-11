import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ProductService, type ProductModel } from "../api/productService";
import { SaleService, type SaleSummary } from "../api/saleService";
import { StatsService, type DayStat, type ProductStat } from "../api/statsService";
import PageHeader from "../components/PageHeader";
import Segmented from "../components/Segmented";
import Stat from "../components/Stat";
import WeekBars from "../components/charts/WeekBars";
import { formatMoney, parseDate } from "../lib/format";
import { btnPrimary } from "../lib/ui";

const LOW_STOCK = 10;

function dayKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function percentChange(current: number, previous: number) {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [products, setProducts] = useState<ProductModel[]>([]);
  const [sales, setSales] = useState<SaleSummary[]>([]);
  const [days, setDays] = useState<DayStat[]>([]);
  const [topProducts, setTopProducts] = useState<ProductStat[]>([]);
  const [topRange, setTopRange] = useState<"today" | "week">("today");

  const today = useMemo(() => new Date(), []);
  const thisMonday = useMemo(() => {
    const sinceMonday = (today.getDay() + 6) % 7;
    return addDays(today, -sinceMonday);
  }, [today]);
  const prevMonday = addDays(thisMonday, -7);

  useEffect(() => {
    (async () => {
      try {
        const [productList, saleList, dailyStats] = await Promise.all([
          ProductService.getAll(),
          SaleService.getAll(),
          StatsService.daily(dayKey(prevMonday), dayKey(addDays(thisMonday, 6))),
        ]);
        setProducts(productList);
        setSales(saleList);
        setDays(dailyStats);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
        setFailed(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const from = topRange === "today" ? dayKey(today) : dayKey(thisMonday);
        setTopProducts(await StatsService.topProducts(from, dayKey(today), 8));
      } catch (error) {
        console.error("Failed to load top products:", error);
      }
    })();
  }, [topRange]);

  const byDay = useMemo(() => new Map(days.map((d) => [d.day, d])), [days]);

  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(thisMonday, i));
  const weekLabels = weekDates.map((date) =>
    date.toLocaleDateString(i18n.language, { weekday: "short" })
  );
  const thisWeekStats = weekDates.map((date) => byDay.get(dayKey(date)));
  const prevWeekStats = weekDates.map((date) =>
    byDay.get(dayKey(addDays(date, -7)))
  );

  const sumOf = (list: (DayStat | undefined)[], key: "sales" | "profit") =>
    list.reduce((sum, d) => sum + (d?.[key] ?? 0), 0);

  const thisWeekSales = sumOf(thisWeekStats, "sales");
  const prevWeekSales = sumOf(prevWeekStats, "sales");
  const thisWeekProfit = sumOf(thisWeekStats, "profit");
  const prevWeekProfit = sumOf(prevWeekStats, "profit");
  const elapsedDays = (today.getDay() + 6) % 7 + 1;
  const weekChange = percentChange(thisWeekSales, sumOf(prevWeekStats.slice(0, elapsedDays), "sales"));

  const todayStats = byDay.get(dayKey(today));
  const todaySales = todayStats?.sales ?? 0;
  const todayProfit = todayStats?.profit ?? 0;
  const todayOrders = todayStats?.count ?? 0;

  const lowStock = products
    .filter((p) => p.stock <= LOW_STOCK)
    .sort((a, b) => a.stock - b.stock);
  const recentSales = [...sales]
    .sort(
      (a, b) =>
        parseDate(b.occurred_at).getTime() - parseDate(a.occurred_at).getTime()
    )
    .slice(0, 8);

  const maxQuantity = Math.max(1, ...topProducts.map((p) => p.quantity));

  if (loading) return <p role="status">{t("Cargando...")}</p>;
  if (failed) return <p role="alert">{t("No se pudieron cargar los datos")}</p>;

  return (
    <>
      <PageHeader
        title={t("Dashboard")}
        description={t("Resumen de tu tienda")}
        actions={
          <Link to="/sales" className={btnPrimary}>
            {t("Nueva venta")}
          </Link>
        }
      />

      <dl className="grid grid-cols-2 divide-x divide-line rounded-lg border border-line bg-surface md:grid-cols-4">
        <Stat label={t("Ventas hoy")} value={formatMoney(todaySales)} hint={`${todayOrders} ${t("órdenes")}`} />
        <Stat label={t("Ganancia hoy")} value={formatMoney(todayProfit)} />
        <Stat
          label={t("Ventas esta semana")}
          value={formatMoney(thisWeekSales)}
          hint={
            weekChange === null ? (
              t("Sin datos de la semana anterior")
            ) : (
              <span className={weekChange >= 0 ? "text-success" : "text-danger"}>
                {weekChange >= 0 ? "+" : "−"}
                {Math.abs(weekChange).toFixed(0)}% {t("vs semana anterior")}
              </span>
            )
          }
        />
        <Stat
          label={t("Stock bajo")}
          value={lowStock.length}
          tone={lowStock.length > 0 ? "warn" : "default"}
        />
      </dl>

      <div className="mt-10 grid gap-10 xl:grid-cols-[1.4fr_1fr]">
        <section>
          <h2 className="text-base font-semibold">{t("Ventas por día")}</h2>
          <p className="mt-0.5 mb-6 text-sm text-muted">
            {t("Esta semana comparada con la anterior")}
          </p>

          <WeekBars
            labels={weekLabels}
            current={thisWeekStats.map((d) => d?.sales ?? 0)}
            previous={prevWeekStats.map((d) => d?.sales ?? 0)}
            currentLabel={t("Esta semana")}
            previousLabel={t("Semana anterior")}
            format={formatMoney}
          />

          <table className="mt-8 w-full border-y border-line text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="px-3 py-2 text-left text-xs font-medium text-muted">{t("Día")}</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-muted">{t("Esta semana")}</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-muted">{t("Semana anterior")}</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-muted">{t("Ganancia")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {weekDates.map((date, i) => (
                <tr key={dayKey(date)}>
                  <td className="px-3 py-2 capitalize">{weekLabels[i]}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatMoney(thisWeekStats[i]?.sales ?? 0)}
                  </td>
                  <td className="px-3 py-2 text-right text-muted tabular-nums">
                    {formatMoney(prevWeekStats[i]?.sales ?? 0)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatMoney(thisWeekStats[i]?.profit ?? 0)}
                  </td>
                </tr>
              ))}
              <tr className="font-medium">
                <td className="px-3 py-2">{t("Total")}</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatMoney(thisWeekSales)}</td>
                <td className="px-3 py-2 text-right text-muted tabular-nums">{formatMoney(prevWeekSales)}</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {formatMoney(thisWeekProfit)}
                  <span className="ml-2 text-xs font-normal text-muted">
                    {t("semana anterior")} {formatMoney(prevWeekProfit)}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold">{t("Lo más vendido")}</h2>
              <p className="mt-0.5 text-sm text-muted">
                {topRange === "today" ? t("Unidades vendidas hoy") : t("Unidades vendidas esta semana")}
              </p>
            </div>
            <Segmented
              value={topRange}
              options={[
                { value: "today", label: t("Hoy") },
                { value: "week", label: t("Esta semana") },
              ]}
              onChange={setTopRange}
            />
          </div>

          {topProducts.length === 0 ? (
            <p className="text-sm text-muted">{t("Sin ventas en este periodo")}</p>
          ) : (
            <ul className="space-y-3">
              {topProducts.map((product, index) => (
                <li key={`${product.name}-${index}`} className="text-sm">
                  <div className="mb-1 flex justify-between gap-3">
                    <span className="truncate font-medium">{product.name}</span>
                    <span className="tabular-nums text-muted">
                      {product.quantity} · {t("ganancia")} {formatMoney(product.profit)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-hover">
                    <div
                      className="h-2 rounded-full bg-accent transition-[width] duration-500"
                      style={{ width: `${(product.quantity / maxQuantity) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-2">
        <section>
          <h2 className="text-base font-semibold">{t("Ventas recientes")}</h2>
          {recentSales.length === 0 ? (
            <p className="mt-3 text-sm text-muted">
              {t("Todavía no hay ventas registradas")}
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-line border-y border-line">
              {recentSales.map((sale) => (
                <li key={sale.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="font-medium">Ticket #{sale.id}</p>
                    <p className="text-muted tabular-nums">
                      {parseDate(sale.occurred_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <p className="font-medium tabular-nums">{formatMoney(sale.total)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="text-base font-semibold">{t("Productos por agotarse")}</h2>
          {lowStock.length === 0 ? (
            <p className="mt-3 text-sm text-muted">
              {t("Todos los productos tienen stock suficiente")}
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-line border-y border-line">
              {lowStock.slice(0, 8).map((product) => (
                <li key={product.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-muted">{t(product.category || "General")}</p>
                  </div>
                  <p
                    className={`font-medium tabular-nums ${
                      product.stock === 0 ? "text-danger" : "text-warn"
                    }`}
                  >
                    {product.stock} {t("unidades")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
