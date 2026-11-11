import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Banknote,
  Check,
  CreditCard,
  Landmark,
  Minus,
  Plus,
  ScanLine,
  Trash2,
  X,
} from "lucide-react";
import { ProductService, type ProductModel } from "../api/productService";
import { SaleService, type PaymentMethod } from "../api/saleService";
import { CashService, type CutSummary } from "../api/cashService";
import Keypad from "../components/pos/Keypad";
import { formatMoney } from "../lib/format";
import { btnGhost, btnPrimary, inputClass } from "../lib/ui";

const TAX_RATE = 0.19;
const LOW_STOCK = 10;

const paymentOptions: { value: PaymentMethod; label: string; icon: typeof Banknote }[] = [
  { value: "efectivo", label: "Efectivo", icon: Banknote },
  { value: "tarjeta", label: "Tarjeta", icon: CreditCard },
  { value: "transferencia", label: "Transferencia", icon: Landmark },
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
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [products, setProducts] = useState<ProductModel[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);
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

  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category || "General"))],
    [products]
  );

  const visibleProducts = useMemo(() => {
    const term = search.toLowerCase();
    return products.filter(
      (p) =>
        (category === null || (p.category || "General") === category) &&
        `${p.name} ${p.category || ""} ${p.barcode || ""}`
          .toLowerCase()
          .includes(term)
    );
  }, [products, search, category]);

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

    if (!cashSession) {
      setScanMessage({ text: t("La caja está cerrada. Ábrela para registrar ventas."), tone: "error" });
      return;
    }
    if ((cart.find((item) => item.id === product.id)?.quantity ?? 0) >= product.stock) {
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

  const cancelSale = () => {
    setCart([]);
    setReceived("");
  };

  const pressKey = (key: string) => {
    setReceived((current) => {
      if (key === "⌫") return current.slice(0, -1);
      return (current + key).replace(/^0+(?=\d)/, "").slice(0, 9);
    });
  };

  const subtotal = cart.reduce((s, item) => s + item.price * item.quantity, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;
  const itemCount = cart.reduce((s, item) => s + item.quantity, 0);

  const receivedAmount = received === "" ? total : Number(received) || 0;
  const change =
    payment === "efectivo" ? Math.max(0, receivedAmount - total) : 0;
  const cashShort =
    payment === "efectivo" && cart.length > 0 && receivedAmount + 0.005 < total;
  const canComplete =
    cart.length > 0 && cashSession !== null && !cashShort;

  const processSale = async () => {
    if (!canComplete || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);

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

      setCart([]);
      setReceived("");
      setPayment("efectivo");
      setCompleted({ total: saleTotal });
      window.dispatchEvent(new Event("cash-changed"));
      setProducts(await ProductService.getAll());
    } catch (err) {
      console.error("Sale error", err);
      alert(String(err));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <div className="grid h-full grid-cols-[1fr_380px]">
      <section className="flex min-h-0 flex-col gap-4 p-5">
        {cashSession === null && (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-warn/40 bg-surface px-4 py-3">
            <p className="text-sm text-muted">
              {t("La caja está cerrada. Ábrela para registrar ventas.")}
            </p>
            <Link to="/corte" className={btnPrimary}>
              {t("Abrir caja")}
            </Link>
          </div>
        )}

        <div>
          <div className="relative">
            <ScanLine className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-muted" />
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
              className={`${inputClass} h-12 pl-12 text-base`}
            />
          </div>
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

        <div className="flex flex-wrap gap-2">
          <CategoryChip
            active={category === null}
            onClick={() => setCategory(null)}
            label={t("Todos")}
          />
          {categories.map((c) => (
            <CategoryChip
              key={c}
              active={category === c}
              onClick={() => setCategory(c)}
              label={t(c)}
            />
          ))}
        </div>

        {visibleProducts.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted">
            {t("No se encontraron productos")}
          </p>
        ) : (
          <div className="grid min-h-0 flex-1 grid-cols-[repeat(auto-fill,minmax(160px,1fr))] content-start gap-3 overflow-y-auto pr-1">
            {visibleProducts.map((product) => {
              const disabled = product.stock === 0 || cashSession === null;
              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => addToCart(product)}
                  disabled={disabled}
                  className="flex h-28 flex-col justify-between rounded-lg border border-line bg-surface p-3 text-left transition-colors duration-150 hover:border-ink disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98]"
                >
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-sm leading-snug font-medium">
                      {product.name}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted">
                      {t(product.category || "General")}
                    </p>
                  </div>
                  <div className="flex items-end justify-between gap-2">
                    <span className="text-lg font-semibold tabular-nums">
                      {formatMoney(product.price)}
                    </span>
                    <span
                      className={`text-xs tabular-nums ${
                        product.stock === 0
                          ? "text-danger"
                          : product.stock <= LOW_STOCK
                          ? "text-warn"
                          : "text-muted"
                      }`}
                    >
                      {product.stock === 0 ? t("Agotado") : product.stock}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <aside className="flex min-h-0 flex-col border-l border-line bg-surface">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <div>
            <h2 className="text-sm font-semibold">{t("Ticket")}</h2>
            <p className="text-xs text-muted tabular-nums">
              {itemCount} {t("productos")}
            </p>
          </div>
          {cart.length > 0 && (
            <button onClick={cancelSale} className={`${btnGhost} h-8 px-2`}>
              <X className="h-3.5 w-3.5" />
              {t("Cancelar")}
            </button>
          )}
        </div>

        {cart.length === 0 ? (
          <div className="flex flex-1 items-center justify-center px-5 text-sm text-muted">
            {t("El carrito está vacío")}
          </div>
        ) : (
          <ul className="min-h-0 flex-1 divide-y divide-line overflow-y-auto">
            {cart.map((item) => (
              <li key={item.id} className="anim-row flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted tabular-nums">
                    {formatMoney(item.price)} × {item.quantity}
                  </p>
                </div>

                <div className="flex items-center rounded-md border border-line">
                  <button
                    onClick={() => decreaseQuantity(item.id)}
                    aria-label={t("Disminuir")}
                    className="flex h-8 w-8 items-center justify-center text-muted hover:text-ink"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-7 text-center text-sm tabular-nums">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => increaseQuantity(item.id)}
                    aria-label={t("Aumentar")}
                    disabled={item.quantity >= item.stock}
                    className="flex h-8 w-8 items-center justify-center text-muted hover:text-ink disabled:opacity-30"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>

                <p className="w-24 text-right text-sm font-medium tabular-nums">
                  {formatMoney(item.price * item.quantity)}
                </p>

                <button
                  onClick={() => removeFromCart(item.id)}
                  aria-label={t("Quitar")}
                  className="text-muted transition-colors hover:text-danger"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="shrink-0 space-y-4 border-t border-line p-5">
          <div className="flex items-end justify-between">
            <div className="space-y-0.5 text-xs text-muted tabular-nums">
              <p>
                {t("Subtotal")} {formatMoney(subtotal)}
              </p>
              <p>
                {t("Impuesto (19%)")} {formatMoney(tax)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-muted">{t("Total")}</p>
              <p className="text-4xl leading-none font-semibold tracking-tight tabular-nums">
                {formatMoney(total)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {paymentOptions.map((option) => {
              const Icon = option.icon;
              const active = payment === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPayment(option.value)}
                  aria-pressed={active}
                  className={`flex h-14 flex-col items-center justify-center gap-1 rounded-md border text-xs font-medium transition-colors duration-150 ${
                    active
                      ? "border-accent bg-accent text-accent-ink"
                      : "border-line text-muted hover:bg-hover hover:text-ink"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {t(option.label)}
                </button>
              );
            })}
          </div>

          {payment === "efectivo" && (
            <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-3">
              <div className="space-y-2">
                <div className="flex items-baseline justify-between rounded-md bg-hover px-3 py-2">
                  <span className="text-xs text-muted">{t("Recibido")}</span>
                  <span className="text-lg font-semibold tabular-nums">
                    {formatMoney(receivedAmount)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between px-3">
                  <span className="text-xs text-muted">
                    {cashShort ? t("Faltan") : t("Cambio")}
                  </span>
                  <span
                    className={`font-medium tabular-nums ${
                      cashShort ? "text-danger" : ""
                    }`}
                  >
                    {cashShort
                      ? formatMoney(total - receivedAmount)
                      : formatMoney(change)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setReceived(String(Math.ceil(total)))}
                  disabled={cart.length === 0}
                  className={`${btnGhost} w-full border border-line`}
                >
                  {t("Exacto")}
                </button>
              </div>
              <Keypad onKey={pressKey} />
            </div>
          )}

          <button
            onClick={processSale}
            disabled={!canComplete || submitting}
            className={`${btnPrimary} h-14 w-full text-base`}
          >
            <Check className="h-5 w-5" />
            {t("Completar venta")}
          </button>
        </div>
      </aside>

      {completed &&
        createPortal(
          <div
            role="status"
            className="anim-toast fixed right-6 bottom-6 z-50 flex items-center gap-4 rounded-lg border border-line bg-surface px-5 py-4"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-success text-surface">
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
    </div>
  );
}

function CategoryChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`h-8 rounded-full border px-4 text-sm transition-colors duration-150 ${
        active
          ? "border-accent bg-accent font-medium text-accent-ink"
          : "border-line text-muted hover:text-ink"
      }`}
    >
      {label}
    </button>
  );
}
