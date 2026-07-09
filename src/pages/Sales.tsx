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

import { ProductService, ProductModel } from "../api/productService";
import { SaleService } from "../api/saleService";

export default function Sales() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<ProductModel[]>([]);
  const [, setSales] = useState<any[]>([]);
  const [lastSaleTotal, setLastSaleTotal] = useState(0);

  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<any[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);

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

  const filteredProducts = useMemo(() => {
    return products.filter((p) =>
      `${p.name} ${p.category || ""}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [products, search]);

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

  const subtotal = cart.reduce((s, item) => s + item.price * item.quantity, 0);
  const tax = subtotal * 0.19;
  const total = subtotal + tax;

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
    <div className="min-h-screen">
      {/* Topbar */}
      <div className="h-16 border-b border-border bg-card px-8 flex items-center justify-between sticky top-0 z-10">
        <h2 className="text-lg font-semibold text-foreground tracking-tight">
          {t("Punto de Venta")}
        </h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ShoppingCart className="w-4 h-4" />
          <span>
            {cart.length} {t("productos")}
          </span>
        </div>
      </div>

      <div className="p-8">
        <div className="mb-6">
          <p className="text-muted-foreground">
            {t("Selecciona productos para agregar a la venta")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* PRODUCTS */}
          <div className="lg:col-span-2">
            {/* Search */}
            <div className="mb-5">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-[18px] h-[18px]" />
                <input
                  type="text"
                  placeholder={t("Buscar productos por nombre o categoría...")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-card border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>
            </div>

            {/* Product list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="bg-card rounded-xl p-5 border border-border hover:border-primary/40 hover:shadow-sm transition-all duration-150 group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-foreground font-semibold mb-0.5 truncate">
                          {product.name}
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          {product.category}
                        </p>
                      </div>

                      <div
                        className={`px-2 py-0.5 rounded-md text-xs font-medium shrink-0 ${
                          product.stock > 10
                            ? "bg-primary/10 text-primary"
                            : product.stock > 5
                            ? "bg-warning/10 text-warning"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {t("Stock")}: {product.stock}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-xl font-semibold text-foreground tracking-tight">
                        ${product.price.toLocaleString()}
                      </div>

                      <button
                        onClick={() => addToCart(product)}
                        disabled={product.stock === 0}
                        className="bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground px-4 py-2 rounded-lg font-medium text-sm transition-colors disabled:cursor-not-allowed flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        {t("Agregar")}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 bg-card rounded-xl p-12 text-center border border-border">
                  <Package className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {t("No se encontraron productos")}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* CART */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl border border-border sticky top-24">
              {/* CART HEADER */}
              <div className="px-6 py-5 border-b border-border">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="w-[18px] h-[18px] text-primary" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">
                    {t("Carrito")}
                  </h3>
                </div>
                <p className="text-muted-foreground text-sm">
                  {cart.length} {t("productos")}
                </p>
              </div>

              {/* CART ITEMS */}
              <div className="p-4 max-h-96 overflow-y-auto">
                {cart.length > 0 ? (
                  <div className="space-y-2.5">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="bg-muted/50 rounded-lg p-3 border border-border"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-foreground font-medium text-sm flex-1 pr-2">
                            {item.name}
                          </h4>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                            aria-label={t("Eliminar")}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-0.5">
                            <button
                              onClick={() => decreaseQuantity(item.id)}
                              className="w-6 h-6 flex items-center justify-center text-foreground hover:bg-muted rounded transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-foreground font-medium w-7 text-center text-sm">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => increaseQuantity(item.id)}
                              className="w-6 h-6 flex items-center justify-center text-foreground hover:bg-muted rounded transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="text-foreground font-semibold">
                            ${(item.price * item.quantity).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">
                      {t("El carrito está vacío")}
                    </p>
                  </div>
                )}
              </div>

              {/* TOTALS */}
              {cart.length > 0 && (
                <>
                  <div className="px-6 py-5 border-t border-border space-y-2.5">
                    <div className="flex justify-between text-muted-foreground text-sm">
                      <span>{t("Subtotal")}:</span>
                      <span>${subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground text-sm">
                      <span>{t("Impuesto (19%)")}:</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-foreground text-lg font-semibold pt-2.5 border-t border-border">
                      <span>{t("Total")}:</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="px-6 pb-6 space-y-2.5">
                    <button
                      onClick={processSale}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Check className="w-5 h-5" />
                      {t("Completar Venta")}
                    </button>
                    <button
                      onClick={cancelSale}
                      className="w-full bg-muted hover:bg-destructive/10 text-muted-foreground hover:text-destructive font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      {t("Cancelar")}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CONFIRMATION MODAL */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-card rounded-2xl p-8 border border-border shadow-2xl max-w-md mx-4 animate-modal-appear">
            <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-7 h-7 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground text-center mb-1">
              {t("¡Venta completada!")}
            </h3>
            <p className="text-muted-foreground text-center text-sm">
              {t("La venta se ha registrado exitosamente")}
            </p>
            <div className="mt-6 p-4 bg-muted/60 rounded-lg border border-border">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">{t("Total")}:</span>
                <span className="text-foreground font-semibold text-xl">
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
