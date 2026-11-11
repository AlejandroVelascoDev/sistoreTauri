import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Calculator,
  Home,
  LogOut,
  ShoppingCart,
  Package,
  Settings,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "../lib/auth";
import { btnGhost } from "../lib/ui";

export default function Sidebar() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();

  const menuItems = [
    { to: "/", icon: Home, label: t("Dashboard") },
    { to: "/sales", icon: ShoppingCart, label: t("Ventas") },
    { to: "/corte", icon: Calculator, label: t("Corte de caja") },
    { to: "/inventory", icon: Package, label: t("Inventario") },
    { to: "/reports", icon: TrendingUp, label: t("Reportes") },
    { to: "/settings", icon: Settings, label: t("Configuración") },
  ];

  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col border-r border-line bg-surface">
      <div className="flex h-14 items-center px-5">
        <span className="text-base font-semibold tracking-tight">SisStore</span>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 pt-2">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex h-9 items-center gap-3 rounded-md px-3 text-sm transition-colors duration-150 ${
                  isActive
                    ? "bg-hover font-medium text-ink"
                    : "text-muted hover:bg-hover hover:text-ink"
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="flex items-center justify-between gap-2 border-t border-line px-5 py-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {user?.display_name}
          </p>
          <p className="truncate text-xs text-muted">@{user?.username}</p>
        </div>
        <button
          onClick={signOut}
          aria-label={t("Cerrar sesión")}
          title={t("Cerrar sesión")}
          className={`${btnGhost} size-12 shrink-0 px-0`}
        >
          <LogOut className="size-full" />
        </button>
      </div>
    </aside>
  );
}
