import { useState } from "react";
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

export default function Dashboard() {
  const [stats] = useState({
    ventasHoy: { valor: 12450, cambio: 12.5 },
    usuarios: { valor: 248, cambio: 8.2 },
    ordenes: { valor: 52, cambio: -3.1 },
    inventario: { valor: 1284, cambio: 5.7 },
  });

  const [recentSales] = useState([
    { id: "#0012", cliente: "Juan Pérez", monto: 450, hora: "10:30 AM" },
    { id: "#0011", cliente: "María García", monto: 890, hora: "10:15 AM" },
    { id: "#0010", cliente: "Carlos López", monto: 320, hora: "09:45 AM" },
  ]);

  const StatCard = ({
    titulo,
    valor,
    cambio,
    icono: Icon,
    color,
    prefix = "$",
  }) => {
    const esPositivo = cambio > 0;

    return (
      <div className="bg-linear-to-br from-slate-800 to-slate-900 rounded-2xl p-6 shadow-xl border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 group">
        <div className="flex items-start justify-between mb-4">
          <div
            className={`w-12 h-12 rounded-xl bg-linear-to-br ${color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
          >
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
              esPositivo
                ? "bg-green-500/10 text-green-400"
                : "bg-red-500/10 text-red-400"
            }`}
          >
            {esPositivo ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span className="text-xs font-medium">{Math.abs(cambio)}%</span>
          </div>
        </div>

        <h3 className="text-gray-400 text-sm font-medium mb-1">{titulo}</h3>
        <p className="text-3xl font-bold text-white">
          {prefix}
          {typeof valor === "number" ? valor.toLocaleString() : valor}
        </p>

        <div className="mt-3 pt-3 border-t border-slate-700/50">
          <p className="text-xs text-gray-500">vs. día anterior</p>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 p-8 overflow-y-auto min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-4xl font-bold bg-linear-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
          Dashboard
        </h2>
        <p className="text-gray-400">Resumen de tu tienda en tiempo real</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          titulo="Ventas hoy"
          valor={stats.ventasHoy.valor}
          cambio={stats.ventasHoy.cambio}
          icono={DollarSign}
          color="from-blue-500 to-blue-600"
          prefix="$"
        />

        <StatCard
          titulo="Usuarios activos"
          valor={stats.usuarios.valor}
          cambio={stats.usuarios.cambio}
          icono={Users}
          color="from-purple-500 to-purple-600"
          prefix=""
        />

        <StatCard
          titulo="Órdenes hoy"
          valor={stats.ordenes.valor}
          cambio={stats.ordenes.cambio}
          icono={ShoppingCart}
          color="from-green-500 to-green-600"
          prefix=""
        />

        <StatCard
          titulo="Productos stock"
          valor={stats.inventario.valor}
          cambio={stats.inventario.cambio}
          icono={Package}
          color="from-orange-500 to-orange-600"
          prefix=""
        />
      </div>

      {/* Secondary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ventas Recientes */}
        <div className="lg:col-span-2 bg-linear-to-br from-slate-800 to-slate-900 rounded-2xl p-6 shadow-xl border border-slate-700/50">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Ventas recientes</h3>
            <button className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-1 transition-colors">
              Ver todas
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {recentSales.map((venta) => (
              <div
                key={venta.id}
                className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700/30 hover:border-slate-600/50 transition-all duration-200 group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    {venta.id}
                  </div>
                  <div>
                    <p className="text-white font-medium group-hover:text-blue-400 transition-colors">
                      {venta.cliente}
                    </p>
                    <p className="text-gray-500 text-sm flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {venta.hora}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-green-400 font-bold text-lg">
                    ${venta.monto.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-linear-to-br from-slate-800 to-slate-900 rounded-2xl p-6 shadow-xl border border-slate-700/50">
          <h3 className="text-xl font-bold text-white mb-6">
            Acciones rápidas
          </h3>

          <div className="space-y-3">
            <button className="w-full bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105">
              Nueva venta
            </button>

            <button className="w-full bg-slate-700/50 hover:bg-slate-700 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 border border-slate-600/50 hover:border-slate-500">
              Agregar producto
            </button>

            <button className="w-full bg-slate-700/50 hover:bg-slate-700 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 border border-slate-600/50 hover:border-slate-500">
              Registrar cliente
            </button>

            <button className="w-full bg-slate-700/50 hover:bg-slate-700 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 border border-slate-600/50 hover:border-slate-500">
              Ver reportes
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-700/50">
            <div className="bg-linear-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-4">
              <p className="text-green-400 text-sm font-medium mb-1">
                Estado del sistema
              </p>
              <p className="text-gray-400 text-xs">
                Todos los servicios operando normalmente
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
