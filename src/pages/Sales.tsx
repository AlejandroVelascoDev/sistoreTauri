import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Check, Minus, Plus, Search, ShoppingCart, X } from "lucide-react";
import { ProductService, type ProductModel } from "../api/productService";
import { SaleService, type PaymentMethod } from "../api/saleService";
import { CashService, type CutSummary } from "../api/cashService";
import PageHeader from "../components/PageHeader";
import Segmented from "../components/Segmented";
import { formatMoney } from "../lib/format";
import {
  btnGhost,
  btnPrimary,
  btnSecondary,
  inputClass,
  tableCell,
  tableHead,
} from "../lib/ui";

const TAX_RATE = 0.19;
const LOW_STOCK = 10;

const paymentOptions: { value: PaymentMethod; label: string }[] = [
  { value: "efectivo", label: "Efectivo" },
  { value: "tarjeta", label: "Tarjeta" },
  { value: "transferencia", label: "Transferencia" },
];

type CartItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  stock: number;
};

export default function Sales() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<ProductModel[]>([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [completed, setCompleted] = useState<{ total: number } | null>(null);
  const [cashSession, setCashSession] = useState<CutSummary | null>(null);
  const [payment, setPayment] = useState<PaymentMethod>("efectivo");
  const [received, setReceived] = useState("");
  const [scanMessage, setScanMessage] = useState<{
    text: string;
    tone: "ok" | "error";
  } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setProducts(await ProductService.getAll());
        setCashSession(await CashService.getCurrent());
      } catch (err) {
        console.error("Error loading data", err);
      }
    })();
  }, []);

  useEffect(() => {
    if (!completed) return;
    const id = setTimeout(() => setCompleted(null), 3500);
    return () => clearTimeout(id);
  }, [completed]);

  const filteredProducts = useMemo(() => {
    const term = search.toLowerCase();
    return products.filter((p) =>
      `${p.name} ${p.category || ""} ${p.barcode || ""}`
        .toLowerCase()
        .includes(term)
    );
  }, [products, search]);

  const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();

    const code = search.trim();
    if (!code) return;

    const product = products.find((p) => p.barcode === code);
    if (!product) {
      if (/^\d+$/.test(code)) {
        setScanMessage({
          text: t("No hay un producto con el código {{code}}", { code }),
          tone: "error",
        });
      }
      return;
    }

    if (product.stock === 0) {
      setScanMessage({
        text: t("{{name}} no tiene stock", { name: product.name }),
        tone: "error",
      });
      return;
    }

    addToCart(product);
    setSearch("");
    setScanMessage({
      text: t("Agregado: {{name}}", { name: product.name }),
      tone: "ok",
    });
  };

  const addToCart = (product: ProductModel) => {
    setCart((current) => {
      const exists = current.find((c) => c.id === product.id);
      if (exists) {
        if (exists.quantity >= product.stock) return current;
        return current.map((c) =>
          c.id === product.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [
        ...current,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          stock: product.stock,
        },
      ];
    });
  };

  const increaseQuantity = (id: number) => {
    setCart((current) =>
      current.map((c) =>
        c.id === id && c.quantity < c.stock
          ? { ...c, quantity: c.quantity + 1 }
          : c
      )
    );
  };

  const decreaseQuantity = (id: number) => {
    setCart((current) =>
      current
        .map((c) =>
          c.id === id && c.quantity > 1 ? { ...c, quantity: c.quantity - 1 } : c
        )
        .filter((c) => c.quantity > 0)
    );
  };

  const removeFromCart = (id: number) => {
    setCart((current) => current.filter((c) => c.id !== id));
  };

  const cancelSale = () => setCart([]);

  const subtotal = cart.reduce((s, item) => s + item.price * item.quantity, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;
  const itemCount = cart.reduce((s, item) => s + item.quantity, 0);

  const receivedAmount = Number(received) || 0;
  const change =
    payment === "efectivo" ? Math.max(0, receivedAmount - total) : 0;
  const cashShort =
    payment === "efectivo" && cart.length > 0 && receivedAmount + 0.005 < total;
  const canComplete =
    cart.length > 0 && cashSession !== null && !cashShort;

  const processSale = async () => {
    if (!canComplete) return;

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
        payment_method: payment,
        received: payment === "efectivo" ? receivedAmount : null,
      });

      setProducts(await ProductService.getAll());
      setCart([]);
      setReceived("");
      setPayment("efectivo");
      setCompleted({ total: saleTotal });
    } catch (err) {
      console.error("Sale error", err);
      alert(String(err));
    }
  };

  return (
    <>
      <PageHeader
        title={t("Punto de venta")}
        description={t("Selecciona productos para agregar a la venta")}
      />

      {cashSession === null && (
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-line bg-surface px-5 py-4">
          <p className="text-sm text-muted">
            {t("La caja está cerrada. Ábrela para registrar ventas.")}
          </p>
          <Link to="/corte" className={btnPrimary}>
            {t("Abrir caja")}
          </Link>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <section>
          <div className="relative mb-4">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="text"
              autoFocus
              placeholder={t("Buscar o escanear código de barras...")}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setScanMessage(null);
              }}
              onKeyDown={handleSearchKeyDown}
              className={`${inputClass} pl-9`}
            />
            {scanMessage && (
              <p
                role="status"
                className={`mt-2 text-sm ${
                  scanMessage.tone === "error" ? "text-warn" : "text-muted"
                }`}
              >
                {scanMessage.text}
              </p>
            )}
          </div>

          {filteredProducts.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted">
              {t("No se encontraron productos")}
            </p>
          ) : (
            <table className="w-full border-y border-line">
              <thead>
                <tr className="border-b border-line">
                  <th className={tableHead}>{t("Producto")}</th>
                  <th className={`${tableHead} text-right`}>{t("Stock")}</th>
                  <th className={`${tableHead} text-right`}>{t("Precio")}</th>
                  <th className="w-24" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-hover">
                    <td className={tableCell}>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-muted">
                        {t(product.category || "General")}
                        {product.barcode && (
                          <span className="tabular-nums"> · {product.barcode}</span>
                        )}
                      </p>
                    </td>
                    <td
                      className={`${tableCell} text-right tabular-nums ${
                        product.stock === 0
                          ? "text-danger"
                          : product.stock <= LOW_STOCK
                          ? "text-warn"
                          : "text-muted"
                      }`}
                    >
                      {product.stock}
                    </td>
                    <td className={`${tableCell} text-right font-medium tabular-nums`}>
                      {formatMoney(product.price)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => addToCart(product)}
                        disabled={product.stock === 0 || cashSession === null}
                        className={`${btnSecondary} h-8 px-3`}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        {t("Agregar")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <aside className="self-start rounded-lg border border-line bg-surface lg:sticky lg:top-8">
          <div className="flex items-baseline justify-between border-b border-line px-5 py-4">
            <h2 className="text-base font-semibold">{t("Carrito")}</h2>
            <p className="text-sm text-muted tabular-nums">
              {itemCount} {t("productos")}
            </p>
          </div>

          {cart.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-5 py-14 text-center">
              <ShoppingCart className="h-5 w-5 text-muted" />
              <p className="text-sm text-muted">{t("El carrito está vacío")}</p>
            </div>
          ) : (
            <ul className="max-h-96 divide-y divide-line overflow-y-auto px-5">
              {cart.map((item) => (
                <li key={item.id} className="anim-row py-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium">{item.name}</p>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      aria-label={t("Quitar")}
                      className={`${btnGhost} -mt-1 -mr-2 h-7 w-7 px-0`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center rounded-md border border-line">
                      <button
                        onClick={() => decreaseQuantity(item.id)}
                        aria-label={t("Disminuir")}
                        className="flex h-7 w-7 items-center justify-center text-muted hover:text-ink"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center text-sm tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => increaseQuantity(item.id)}
                        aria-label={t("Aumentar")}
                        disabled={item.quantity >= item.stock}
                        className="flex h-7 w-7 items-center justify-center text-muted hover:text-ink disabled:opacity-30"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="text-sm font-medium tabular-nums">
                      {formatMoney(item.price * item.quantity)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {cart.length > 0 && (
            <div className="space-y-5 border-t border-line p-5">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between text-muted">
                  <dt>{t("Subtotal")}</dt>
                  <dd className="tabular-nums">{formatMoney(subtotal)}</dd>
                </div>
                <div className="flex justify-between text-muted">
                  <dt>{t("Impuesto (19%)")}</dt>
                  <dd className="tabular-nums">{formatMoney(tax)}</dd>
                </div>
              </dl>

              <div className="flex items-baseline justify-between border-t border-line pt-4">
                <span className="text-sm font-medium">{t("Total")}</span>
                <span className="text-3xl font-semibold tracking-tight tabular-nums">
                  {formatMoney(total)}
                </span>
              </div>

              <div className="space-y-3">
                <Segmented
                  value={payment}
                  options={paymentOptions.map((option) => ({
                    ...option,
                    label: t(option.label),
                  }))}
                  onChange={setPayment}
                  className="w-full"
                />

                {payment === "efectivo" && (
                  <div className="space-y-2">
                    <label className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-muted">{t("Recibido")}</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={received}
                        onChange={(e) => setReceived(e.target.value)}
                        placeholder={total.toFixed(2)}
                        className={`${inputClass} h-9 w-36 text-right tabular-nums`}
                      />
                    </label>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">{t("Cambio")}</span>
                      <span
                        className={`font-medium tabular-nums ${
                          cashShort ? "text-danger" : ""
                        }`}
                      >
                        {cashShort
                          ? t("Faltan {{amount}}", {
                              amount: formatMoney(total - receivedAmount),
                            })
                          : formatMoney(change)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <button
                  onClick={processSale}
                  disabled={!canComplete}
                  className={`${btnPrimary} h-11 w-full`}
                >
                  <Check className="h-4 w-4" />
                  {t("Completar venta")}
                </button>
                <button
                  onClick={cancelSale}
                  className={`${btnGhost} w-full`}
                >
                  {t("Cancelar")}
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>

      {completed &&
        createPortal(
          <div
            role="status"
            className="anim-toast fixed right-6 bottom-6 z-50 flex items-center gap-4 rounded-lg border border-line bg-surface px-5 py-4"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-ink">
              <Check className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-medium">{t("Venta completada")}</p>
              <p className="text-sm text-muted tabular-nums">
                {t("Total")} {formatMoney(completed.total)}
              </p>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
