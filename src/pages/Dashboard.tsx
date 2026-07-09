import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  DollarSign,
  Users,
  ShoppingCart,
  Package,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Clock,
} from "lucide-react";
import { ProductService } from "../api/productService";
import { SaleService } from "../api/saleService";

interface StatCardProps {
  title: string;
  value: number;
  cambio: number;
  icon: React.ComponentType<{ className: string }>;
  prefix?: string;
}

export default function Dashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    ventasHoy: { valor: 0, cambio: 0 },
    usuarios: { valor: 248, cambio: 8.2 },
    ordenes: { valor: 0, cambio: 0 },
    inventario: { valor: 0, cambio: 0 },
  });
  const [recentSales, setRecentSales] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const products = await ProductService.getAll();
        const sales = await SaleService.getAll();

        const today = new Date().toDateString();

        const salesToday = sales.filter(
          (sale: any) => new Date(sale.created_at).toDateString() === today
        );

        const ventasHoy = salesToday.reduce((sum: number, s: any) => sum + s.total, 0);
        const ordenesHoy = salesToday.length;
        const inventario = products.reduce((sum: number, p: any) => sum + p.stock, 0);

        const sortedSales = sales.sort(
          (a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        const recentSalesData = sortedSales.slice(0, 4).map((sale: any) => ({
          id: `#${String(sale.id).padStart(4, "0")}`,
          cliente: "Ticket #" + sale.id,
          monto: sale.total,
          hora: new Date(sale.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        }));

        setStats({
          ventasHoy: { valor: ventasHoy, cambio: 0 },
          usuarios: { valor: 248, cambio: 8.2 },
          ordenes: { valor: ordenesHoy, cambio: 0 },
          inventario: { valor: inventario, cambio: 0 },
        });

        setRecentSales(recentSalesData);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      }
    }

    loadData();
  }, []);

  const StatCard = ({
    title,
    value,
    cambio,
    icon: Icon,
    prefix = "$",
  }: StatCardProps) => {
    const esPositivo = cambio >= 0;

    return (
      <div className="bg-card rounded-xl p-5 border border-border hover:shadow-sm transition-shadow duration-200">
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
            <Icon className="w-5 h-5 text-foreground" />
          </div>
          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
              esPositivo
                ? "bg-primary/10 text-primary"
                : "bg-destructive/10 text-destructive"
            }`}
          >
            {esPositivo ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>{Math.abs(cambio)}%</span>
          </div>
        </div>

        <h3 className="text-muted-foreground text-sm font-medium mb-1">
          {title}
        </h3>
        <p className="text-2xl font-semibold text-foreground tracking-tight">
          {prefix}
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>

        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground">{t("vs. día anterior")}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      {/* Topbar */}
      <div className="h-16 border-b border-border bg-card px-8 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h2 className="text-lg font-semibold text-foreground tracking-tight">
            {t("Dashboard")}
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString("es-ES", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </div>

      <div className="p-8">
        <div className="mb-8">
          <p className="text-muted-foreground">
            {t("Resumen de tu tienda en tiempo real")}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <StatCard
            title={t("Ventas hoy")}
            value={stats.ventasHoy.valor}
            cambio={stats.ventasHoy.cambio}
            icon={DollarSign}
            prefix="$"
          />
          <StatCard
            title={t("Usuarios activos")}
            value={stats.usuarios.valor}
            cambio={stats.usuarios.cambio}
            icon={Users}
            prefix=""
          />
          <StatCard
            title={t("Órdenes hoy")}
            value={stats.ordenes.valor}
            cambio={stats.ordenes.cambio}
            icon={ShoppingCart}
            prefix=""
          />
          <StatCard
            title={t("Productos stock")}
            value={stats.inventario.valor}
            cambio={stats.inventario.cambio}
            icon={Package}
            prefix=""
          />
        </div>

        {/* Secondary Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Ventas Recientes */}
          <div className="lg:col-span-2 bg-card rounded-xl border border-border overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <h3 className="text-base font-semibold text-foreground">
                {t("Ventas recientes")}
              </h3>
              <button className="text-primary hover:text-primary/80 text-sm font-medium flex items-center gap-1 transition-colors">
                {t("Ver todas")}
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            <div className="divide-y divide-border">
              {recentSales.length > 0 ? (
                recentSales.map((venta) => (
                  <div
                    key={venta.id}
                    className="flex items-center justify-between px-6 py-4 hover:bg-muted/60 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center text-foreground font-semibold text-xs">
                        {venta.id}
                      </div>
                      <div>
                        <p className="text-foreground font-medium text-sm">
                          {venta.cliente}
                        </p>
                        <p className="text-muted-foreground text-xs flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {venta.hora}
                        </p>
                      </div>
                    </div>
                    <p className="text-foreground font-semibold">
                      ${venta.monto.toLocaleString()}
                    </p>
                  </div>
                ))
              ) : (
                <div className="px-6 py-12 text-center">
                  <ShoppingCart className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">
                    {t("No hay ventas registradas")}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-base font-semibold text-foreground mb-5">
              {t("Acciones rápidas")}
            </h3>

            <div className="space-y-2.5">
              <button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2.5 px-4 rounded-lg transition-colors text-sm">
                {t("Nueva venta")}
              </button>
              <button className="w-full bg-muted hover:bg-border text-foreground font-medium py-2.5 px-4 rounded-lg transition-colors text-sm">
                {t("Agregar producto")}
              </button>
              <button className="w-full bg-muted hover:bg-border text-foreground font-medium py-2.5 px-4 rounded-lg transition-colors text-sm">
                {t("Registrar cliente")}
              </button>
              <button className="w-full bg-muted hover:bg-border text-foreground font-medium py-2.5 px-4 rounded-lg transition-colors text-sm">
                {t("Ver reportes")}
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <p className="text-foreground text-sm font-medium">
                    {t("Estado del sistema")}
                  </p>
                </div>
                <p className="text-muted-foreground text-xs">
                  {t("Todos los servicios operando normalmente")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
