import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ProductService, type ProductModel } from "../api/productService";
import { SaleService, type SaleSummary } from "../api/saleService";
import PageHeader from "../components/PageHeader";
import Stat from "../components/Stat";
import { formatMoney, parseDate } from "../lib/format";
import { btnPrimary } from "../lib/ui";

const LOW_STOCK = 10;

export default function Dashboard() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<ProductModel[]>([]);
  const [sales, setSales] = useState<SaleSummary[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [productList, saleList] = await Promise.all([
          ProductService.getAll(),
          SaleService.getAll(),
        ]);
        setProducts(productList);
        setSales(saleList);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      }
    })();
  }, []);

  const today = new Date().toDateString();
  const salesToday = sales.filter(
    (sale) => parseDate(sale.occurred_at).toDateString() === today
  );
  const todayTotal = salesToday.reduce((sum, sale) => sum + sale.total, 0);
  const unitsInStock = products.reduce((sum, p) => sum + p.stock, 0);
  const lowStock = products
    .filter((p) => p.stock <= LOW_STOCK)
    .sort((a, b) => a.stock - b.stock);
  const recentSales = [...sales]
    .sort(
      (a, b) =>
        parseDate(b.occurred_at).getTime() - parseDate(a.occurred_at).getTime()
    )
    .slice(0, 8);

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
        <Stat label={t("Ventas hoy")} value={formatMoney(todayTotal)} />
        <Stat label={t("Órdenes hoy")} value={salesToday.length} />
        <Stat label={t("Unidades en stock")} value={unitsInStock} />
        <Stat
          label={t("Stock bajo")}
          value={lowStock.length}
          tone={lowStock.length > 0 ? "warn" : "default"}
        />
      </dl>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <section>
          <h2 className="text-base font-semibold">{t("Ventas recientes")}</h2>
          {recentSales.length === 0 ? (
            <p className="mt-3 text-sm text-muted">
              {t("Todavía no hay ventas registradas")}
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-line border-y border-line">
              {recentSales.map((sale) => (
                <li
                  key={sale.id}
                  className="flex items-center justify-between py-3 text-sm"
                >
                  <div>
                    <p className="font-medium">Ticket #{sale.id}</p>
                    <p className="text-muted tabular-nums">
                      {parseDate(sale.occurred_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <p className="font-medium tabular-nums">
                    {formatMoney(sale.total)}
                  </p>
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
                <li
                  key={product.id}
                  className="flex items-center justify-between py-3 text-sm"
                >
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
