import { useState, useEffect } from "react";
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  X,
  Check,
  Package,
} from "lucide-react";

export default function Sales() {
  // Estado para productos disponibles
  const [productos, setProductos] = useState([
    {
      id: 1,
      nombre: "Laptop Dell XPS 13",
      precio: 1299,
      stock: 5,
      categoria: "Electrónica",
    },
    {
      id: 2,
      nombre: "Mouse Logitech MX Master",
      precio: 99,
      stock: 15,
      categoria: "Accesorios",
    },
    {
      id: 3,
      nombre: "Teclado Mecánico Corsair",
      precio: 149,
      stock: 8,
      categoria: "Accesorios",
    },
    {
      id: 4,
      nombre: 'Monitor LG 27" 4K',
      precio: 449,
      stock: 6,
      categoria: "Electrónica",
    },
    {
      id: 5,
      nombre: "Webcam Logitech C920",
      precio: 79,
      stock: 12,
      categoria: "Accesorios",
    },
    {
      id: 6,
      nombre: "Audífonos Sony WH-1000XM4",
      precio: 349,
      stock: 10,
      categoria: "Audio",
    },
  ]);

  // Estado para el carrito
  const [carrito, setCarrito] = useState([]);

  // Estado para búsqueda
  const [busqueda, setBusqueda] = useState("");

  // Estado para modal de confirmación
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

  // Estado para historial de ventas
  const [ventas, setVentas] = useState([]);

  // Cargar datos del storage al montar
  useEffect(() => {
    const productosGuardados = localStorage.getItem("productos");
    const ventasGuardadas = localStorage.getItem("ventas");

    if (productosGuardados) {
      setProductos(JSON.parse(productosGuardados));
    }

    if (ventasGuardadas) {
      setVentas(JSON.parse(ventasGuardadas));
    }
  }, []);

  // Guardar productos cuando cambien
  useEffect(() => {
    localStorage.setItem("productos", JSON.stringify(productos));
  }, [productos]);

  // Guardar ventas cuando cambien
  useEffect(() => {
    localStorage.setItem("ventas", JSON.stringify(ventas));
  }, [ventas]);

  // Filtrar productos según búsqueda
  const productosFiltrados = productos.filter(
    (p) =>
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.categoria.toLowerCase().includes(busqueda.toLowerCase())
  );

  // Agregar producto al carrito
  const agregarAlCarrito = (producto) => {
    const itemExistente = carrito.find((item) => item.id === producto.id);

    if (itemExistente) {
      if (itemExistente.cantidad < producto.stock) {
        setCarrito(
          carrito.map((item) =>
            item.id === producto.id
              ? { ...item, cantidad: item.cantidad + 1 }
              : item
          )
        );
      }
    } else {
      setCarrito([...carrito, { ...producto, cantidad: 1 }]);
    }
  };

  // Aumentar cantidad
  const aumentarCantidad = (id) => {
    setCarrito(
      carrito.map((item) => {
        if (item.id === id) {
          const producto = productos.find((p) => p.id === id);
          if (item.cantidad < producto.stock) {
            return { ...item, cantidad: item.cantidad + 1 };
          }
        }
        return item;
      })
    );
  };

  // Disminuir cantidad
  const disminuirCantidad = (id) => {
    setCarrito(
      carrito.map((item) =>
        item.id === id && item.cantidad > 1
          ? { ...item, cantidad: item.cantidad - 1 }
          : item
      )
    );
  };

  // Eliminar del carrito
  const eliminarDelCarrito = (id) => {
    setCarrito(carrito.filter((item) => item.id !== id));
  };

  // Calcular totales
  const subtotal = carrito.reduce(
    (sum, item) => sum + item.precio * item.cantidad,
    0
  );
  const impuesto = subtotal * 0.19; // 19% de impuesto
  const total = subtotal + impuesto;

  // Procesar venta
  const procesarVenta = () => {
    if (carrito.length === 0) return;

    // Actualizar stock de productos
    const productosActualizados = productos.map((producto) => {
      const itemCarrito = carrito.find((item) => item.id === producto.id);
      if (itemCarrito) {
        return {
          ...producto,
          stock: producto.stock - itemCarrito.cantidad,
        };
      }
      return producto;
    });

    // Crear registro de venta
    const nuevaVenta = {
      id: Date.now(),
      fecha: new Date().toISOString(),
      items: carrito,
      subtotal,
      impuesto,
      total,
    };

    // Actualizar estados
    setProductos(productosActualizados);
    setVentas([nuevaVenta, ...ventas]);
    setCarrito([]);
    setMostrarConfirmacion(true);

    // Ocultar confirmación después de 3 segundos
    setTimeout(() => {
      setMostrarConfirmacion(false);
    }, 3000);
  };

  // Cancelar venta
  const cancelarVenta = () => {
    setCarrito([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
          Punto de Venta
        </h2>
        <p className="text-gray-400">
          Selecciona productos para agregar a la venta
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Productos */}
        <div className="lg:col-span-2">
          {/* Búsqueda */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar productos por nombre o categoría..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Lista de productos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {productosFiltrados.length > 0 ? (
              productosFiltrados.map((producto) => (
                <div
                  key={producto.id}
                  className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-5 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-white font-semibold mb-1 group-hover:text-blue-400 transition-colors">
                        {producto.nombre}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {producto.categoria}
                      </p>
                    </div>
                    <div
                      className={`px-2 py-1 rounded-lg text-xs font-medium ${
                        producto.stock > 10
                          ? "bg-green-500/10 text-green-400"
                          : producto.stock > 5
                          ? "bg-yellow-500/10 text-yellow-400"
                          : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      Stock: {producto.stock}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-blue-400">
                      ${producto.precio.toLocaleString()}
                    </div>
                    <button
                      onClick={() => agregarAlCarrito(producto)}
                      disabled={producto.stock === 0}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-gray-600 disabled:to-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Agregar
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 bg-slate-800/50 rounded-xl p-12 text-center border border-slate-700/50">
                <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No se encontraron productos</p>
              </div>
            )}
          </div>
        </div>

        {/* Carrito */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700/50 sticky top-8">
            {/* Header del carrito */}
            <div className="p-6 border-b border-slate-700/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">Carrito</h3>
              </div>
              <p className="text-gray-400 text-sm">
                {carrito.length} productos
              </p>
            </div>

            {/* Items del carrito */}
            <div className="p-4 max-h-96 overflow-y-auto">
              {carrito.length > 0 ? (
                <div className="space-y-3">
                  {carrito.map((item) => (
                    <div
                      key={item.id}
                      className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-white font-medium text-sm flex-1">
                          {item.nombre}
                        </h4>
                        <button
                          onClick={() => eliminarDelCarrito(item.id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 bg-slate-700/50 rounded-lg p-1">
                          <button
                            onClick={() => disminuirCantidad(item.id)}
                            className="w-6 h-6 flex items-center justify-center text-white hover:bg-slate-600 rounded transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-white font-medium w-8 text-center">
                            {item.cantidad}
                          </span>
                          <button
                            onClick={() => aumentarCantidad(item.id)}
                            className="w-6 h-6 flex items-center justify-center text-white hover:bg-slate-600 rounded transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="text-blue-400 font-bold">
                          ${(item.precio * item.cantidad).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ShoppingCart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">El carrito está vacío</p>
                </div>
              )}
            </div>

            {/* Totales */}
            {carrito.length > 0 && (
              <>
                <div className="p-6 border-t border-slate-700/50 space-y-3">
                  <div className="flex justify-between text-gray-400">
                    <span>Subtotal:</span>
                    <span>${subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Impuesto (19%):</span>
                    <span>${impuesto.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-white text-xl font-bold pt-3 border-t border-slate-700/50">
                    <span>Total:</span>
                    <span className="text-green-400">${total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="p-6 pt-0 space-y-3">
                  <button
                    onClick={procesarVenta}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    Completar Venta
                  </button>

                  <button
                    onClick={cancelarVenta}
                    className="w-full bg-slate-700/50 hover:bg-red-600/20 text-gray-300 hover:text-red-400 font-medium py-3 px-4 rounded-xl transition-all duration-200 border border-slate-600/50 hover:border-red-500/50 flex items-center justify-center gap-2"
                  >
                    <X className="w-5 h-5" />
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal de confirmación */}
      {mostrarConfirmacion && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border border-slate-700/50 max-w-md mx-4 animate-in zoom-in duration-200">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white text-center mb-2">
              ¡Venta completada!
            </h3>
            <p className="text-gray-400 text-center">
              La venta se ha registrado exitosamente
            </p>
            <div className="mt-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700/30">
              <div className="flex justify-between text-gray-400 mb-2">
                <span>Total:</span>
                <span className="text-green-400 font-bold text-xl">
                  ${total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
