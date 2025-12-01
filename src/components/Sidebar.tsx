import { Link, useLocation } from "react-router-dom";
import {
  Home,
  ShoppingCart,
  Package,
  Settings,
  TrendingUp,
  DollarSign,
  ChevronRight,
} from "lucide-react";

export default function Sidebar() {
  const location = useLocation();

  const menuItems = [
    { path: "/dashboard", icon: Home, label: "Dashboard" },
    { path: "/dashboard/sales", icon: ShoppingCart, label: "Ventas" },
    { path: "/dashboard/inventory", icon: Package, label: "Inventario" },
    { path: "/dashboard/reports", icon: TrendingUp, label: "Reportes" },
    { path: "/dashboard/settings", icon: Settings, label: "Configuración" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="w-72 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-gray-100 h-screen flex flex-col shadow-2xl border-r border-slate-700/50">
      {/* Header */}
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              SisStore
            </h2>
            <p className="text-xs text-gray-400">Sistema POS</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                group flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl
                transition-all duration-200 relative overflow-hidden
                ${
                  active
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30"
                    : "hover:bg-slate-800/70 text-gray-300 hover:text-white"
                }
              `}
            >
              <div className="flex items-center gap-3 relative z-10">
                <Icon
                  className={`w-5 h-5 ${
                    active
                      ? "text-white"
                      : "text-gray-400 group-hover:text-blue-400"
                  } transition-colors`}
                />
                <span className="font-medium">{item.label}</span>
              </div>

              <ChevronRight
                className={`w-4 h-4 transition-all duration-200 ${
                  active
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                }`}
              />

              {/* Hover effect */}
              {!active && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-600/5 to-purple-600/0 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700/50">
        <div className="bg-slate-800/50 rounded-xl p-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
              A
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">Admin</p>
              <p className="text-xs text-gray-400">Administrador</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
