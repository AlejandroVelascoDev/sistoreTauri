import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Home,
  ShoppingCart,
  Package,
  Settings,
  TrendingUp,
  Store,
} from "lucide-react";

export default function Sidebar() {
  const { t } = useTranslation();
  const location = useLocation();

  const menuItems = [
    { path: "/", icon: Home, label: t("Dashboard") },
    { path: "sales", icon: ShoppingCart, label: t("Ventas") },
    { path: "inventory", icon: Package, label: t("Inventario") },
    { path: "reports", icon: TrendingUp, label: t("Reportes") },
    { path: "settings", icon: Settings, label: t("Configuración") },
  ];

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(`/${path}`);
  };

  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground h-screen flex flex-col border-r border-border">
      {/* Header */}
      <div className="px-6 h-16 flex items-center border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
            <Store className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              SisStore
            </h2>
            <p className="text-xs text-muted-foreground">Sistema POS</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {t("Menú")}
        </p>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-colors duration-150
                ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }
              `}
            >
              <Icon
                className={`w-[18px] h-[18px] transition-colors ${
                  active
                    ? "text-primary"
                    : "text-muted-foreground group-hover:text-foreground"
                }`}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted transition-colors">
          <div className="w-9 h-9 bg-foreground rounded-full flex items-center justify-center text-background font-semibold text-sm">
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              Admin
            </p>
            <p className="text-xs text-muted-foreground truncate">
              Administrador
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
