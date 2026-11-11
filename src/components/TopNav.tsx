import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Calculator,
  Home,
  LogOut,
  Package,
  Settings,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import logo from "../assets/logo-cart.png";
import { CashService, type CutSummary } from "../api/cashService";
import { useAuth } from "../lib/auth";
import { formatMoney } from "../lib/format";
import { btnGhost } from "../lib/ui";

export default function TopNav() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [cash, setCash] = useState<CutSummary | null>(null);
  const [now, setNow] = useState(() => new Date());

  const requestId = useRef(0);
  useEffect(() => {
    const refresh = () => {
      const id = ++requestId.current;
      CashService.getCurrent()
        .then((value) => { if (id === requestId.current) setCash(value); })
        .catch(() => { if (id === requestId.current) setCash(null); });
    };
    refresh();
    window.addEventListener("cash-changed", refresh);
    return () => { ++requestId.current; window.removeEventListener("cash-changed", refresh); };
  }, [location.pathname]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const items = [
    { to: "/", icon: Home, label: t("Dashboard") },
    { to: "/sales", icon: ShoppingCart, label: t("Ventas") },
    { to: "/corte", icon: Calculator, label: t("Corte") },
    { to: "/inventory", icon: Package, label: t("Inventario") },
    { to: "/reports", icon: TrendingUp, label: t("Reportes") },
    { to: "/settings", icon: Settings, label: t("Configuración") },
  ];

  return (
    <header className="flex min-h-14 shrink-0 flex-wrap items-stretch gap-3 py-2 xl:h-14 xl:flex-nowrap xl:gap-6 xl:py-0 border-b border-line bg-surface pl-5">
      <div className="flex items-center gap-2.5">
        <img src={logo} alt="" className="h-8 w-8 object-contain" />
        <span className="text-sm font-semibold tracking-tight">SisStore</span>
      </div>

      <nav className="flex max-w-full flex-wrap items-stretch gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-2 border-b-2 px-3 text-sm transition-colors duration-150 ${
                  isActive
                    ? "border-accent font-medium text-ink"
                    : "border-transparent text-muted hover:text-ink"
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="ml-auto flex flex-wrap items-center gap-3 pr-4 text-sm">
        <Link
          to="/corte"
          className="flex items-center gap-2 rounded-md px-2 text-muted transition-colors hover:text-ink"
        >
          <span
            className={`h-2 w-2 rounded-full ${
              cash ? "bg-success" : "bg-muted"
            }`}
          />
          {cash ? (
            <span className="tabular-nums">
              {t("Caja abierta")} · {formatMoney(cash.expected_cash)}
            </span>
          ) : (
            t("Caja cerrada")
          )}
        </Link>

        <span className="tabular-nums text-muted">
          {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>

        <div className="flex items-center gap-2 border-l border-line pl-5">
          <span className="font-medium">{user?.display_name}</span>
          <button
            onClick={signOut}
            aria-label={t("Cerrar sesión")}
            title={t("Cerrar sesión")}
            className={`${btnGhost} size-10 px-0`}
          >
            <LogOut className="size-full" />
          </button>
        </div>
      </div>
    </header>
  );
}
