import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
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

import {
  ProductService,
  ProductModel,
  CreateProductRequest,
  UpdateProductRequest,
} from "../api/productService";
import { SaleService } from "../api/saleService";

export default function Sales() {
  const { t } = useTranslation();
  // API data
  const [products, setProducts] = useState<ProductModel[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [lastSaleTotal, setLastSaleTotal] = useState(0);

  // UI state
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<any[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Load API data
  useEffect(() => {
    (async () => {
      try {
        setProducts(await ProductService.getAll());
        setSales(await SaleService.getAll());
      } catch (err) {
        console.error("Error loading data", err);
      }
    })();
  }, []);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((p) =>
      `${p.name} ${p.category || ""}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [products, search]);

  // Cart Logic
  const addToCart = (product: ProductModel) => {
    const exists = cart.find((c) => c.id === product.id);
    if (exists) {
      if (exists.quantity >= product.stock) return;
      setCart(
        cart.map((c) =>
          c.id === product.id ? { ...c, quantity: c.quantity + 1 } : c
        )
      );
    } else {
      setCart([
        ...cart,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          stock: product.stock,
        },
      ]);
    }
  };

  const increaseQuantity = (id: number) => {
    setCart(
      cart.map((c) =>
        c.id === id && c.quantity < c.stock
          ? { ...c, quantity: c.quantity + 1 }
          : c
      )
    );
  };

  const decreaseQuantity = (id: number) => {
    setCart(
      cart
        .map((c) =>
          c.id === id && c.quantity > 1 ? { ...c, quantity: c.quantity - 1 } : c
        )
        .filter((c) => c.quantity > 0)
    );
  };

  const removeFromCart = (id: number) => {
    setCart(cart.filter((c) => c.id !== id));
  };

  const cancelSale = () => setCart([]);

  // Totals
  const subtotal = cart.reduce((s, item) => s + item.price * item.quantity, 0);
  const tax = subtotal * 0.19;
  const total = subtotal + tax;

  // Process sale using API
  const processSale = async () => {
    if (cart.length === 0) return;

    try {
      const saleTotal = total;

      await SaleService.create({
        items: cart.map((c) => ({
          product_id: c.id,
          quantity: c.quantity,
          unit_price: c.price,
        })),
        subtotal,
        tax,
        total,
      });

      // Refresh
      setProducts(await ProductService.getAll());
      setSales(await SaleService.getAll());

      setCart([]);
      setLastSaleTotal(saleTotal);
      setShowConfirmation(true);
      setTimeout(() => setShowConfirmation(false), 3000);
    } catch (err) {
      console.error("Sale error", err);
      alert(String(err));
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-4xl font-bold bg-linear-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
          {t("Punto de Venta")}
        </h2>
        <p className="text-gray-400">
          {t("Selecciona productos para agregar a la venta")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PRODUCTS */}
        <div className="lg:col-span-2">
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={t("Buscar productos por nombre o categoría...")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Product list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-linear-to-br from-slate-800 to-slate-900 rounded-xl p-5 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-white font-semibold mb-1 group-hover:text-blue-400 transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {product.category}
                      </p>
                    </div>

                    {/* STOCK */}
                    <div
                      className={`px-2 py-1 rounded-lg text-xs font-medium ${
                        product.stock > 10
                          ? "bg-green-500/10 text-green-400"
                          : product.stock > 5
                          ? "bg-yellow-500/10 text-yellow-400"
                          : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      {t("Stock")}: {product.stock}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-blue-400">
                      ${product.price.toLocaleString()}
                    </div>

                    <button
                      onClick={() => addToCart(product)}
                      disabled={product.stock === 0}
                      className="bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-gray-600 disabled:to-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:scale-105 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      {t("Agregar")}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 bg-slate-800/50 rounded-xl p-12 text-center border border-slate-700/50">
                <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">{t("No se encontraron productos")}</p>
              </div>
            )}
          </div>
        </div>

        {/* CART */}
        <div className="lg:col-span-1">
          <div className="bg-linear-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700/50 sticky top-8">
            {/* CART HEADER */}
            <div className="p-6 border-b border-slate-700/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">{t("Carrito")}</h3>
              </div>
              <p className="text-gray-400 text-sm">{cart.length} {t("productos")}</p>
            </div>

            {/* CART ITEMS */}
            <div className="p-4 max-h-96 overflow-y-auto">
              {cart.length > 0 ? (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-white font-medium text-sm flex-1">
                          {item.name}
                        </h4>

                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 bg-slate-700/50 rounded-lg p-1">
                          <button
                            onClick={() => decreaseQuantity(item.id)}
                            className="w-6 h-6 flex items-center justify-center text-white hover:bg-slate-600 rounded transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>

                          <span className="text-white font-medium w-8 text-center">
                            {item.quantity}
                          </span>

                          <button
                            onClick={() => increaseQuantity(item.id)}
                            className="w-6 h-6 flex items-center justify-center text-white hover:bg-slate-600 rounded transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="text-blue-400 font-bold">
                          ${(item.price * item.quantity).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ShoppingCart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">{t("El carrito está vacío")}</p>
                </div>
              )}
            </div>

            {/* TOTALS */}
            {cart.length > 0 && (
              <>
                <div className="p-6 border-t border-slate-700/50 space-y-3">
                  <div className="flex justify-between text-gray-400">
                    <span>{t("Subtotal")}:</span>
                    <span>${subtotal.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between text-gray-400">
                    <span>{t("Impuesto (19%)")}:</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-white text-xl font-bold pt-3 border-t border-slate-700/50">
                    <span>{t("Total")}:</span>
                    <span className="text-green-400">${total.toFixed(2)}</span>
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="p-6 pt-0 space-y-3">
                  <button
                    onClick={processSale}
                    className="w-full bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    {t("Completar Venta")}
                  </button>

                  <button
                    onClick={cancelSale}
                    className="w-full bg-slate-700/50 hover:bg-red-600/20 text-gray-300 hover:text-red-400 font-medium py-3 px-4 rounded-xl transition-all duration-200 border border-slate-600/50 hover:border-red-500/50 flex items-center justify-center gap-2"
                  >
                    <X className="w-5 h-5" />
                    {t("Cancelar")}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* CONFIRMATION MODAL */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-linear-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border border-slate-700/50 max-w-md mx-4 animate-in zoom-in duration-200">
            <div className="w-16 h-16 bg-linear-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white text-center mb-2">
              {t("¡Venta completada!")}
            </h3>
            <p className="text-gray-400 text-center">
              {t("La venta se ha registrado exitosamente")}
            </p>
            <div className="mt-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700/30">
              <div className="flex justify-between text-gray-400 mb-2">
                <span>{t("Total")}:</span>
                <span className="text-green-400 font-bold text-xl">
                  ${lastSaleTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
