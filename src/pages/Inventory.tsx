import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";
import { Pencil, Plus, ScanLine, Search, Trash2 } from "lucide-react";
import { ProductService, type ProductModel } from "../api/productService";
import Modal from "../components/Modal";
import PageHeader from "../components/PageHeader";
import Stat from "../components/Stat";
import { formatMoney } from "../lib/format";
import {
  btnDanger,
  btnGhost,
  btnPrimary,
  btnSecondary,
  inputClass,
  tableCell,
  tableHead,
} from "../lib/ui";

const LOW_STOCK = 10;
const CATEGORIES = [
  "General",
  "Bebidas",
  "Empaquetados",
  "Refrigerados",
  "Electrónica",
  "Accesorios",
];

type ProductForm = {
  name: string;
  price: string;
  stock: string;
  category: string;
  barcode: string;
};

const emptyForm: ProductForm = {
  name: "",
  price: "",
  stock: "",
  category: "General",
  barcode: "",
};

export default function Inventory() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<ProductModel[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [scanCode, setScanCode] = useState("");
  const [scanMessage, setScanMessage] = useState<{
    text: string;
    tone: "ok" | "error";
  } | null>(null);

  async function loadProducts() {
    try {
      setProducts(await ProductService.getAll());
    } catch (error) {
      console.error("Failed to load products:", error);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.category?.toLowerCase().includes(term) ||
        p.barcode?.toLowerCase().includes(term)
    );
  }, [searchTerm, products]);

  const totalValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);
  const lowStock = products.filter((p) => p.stock < LOW_STOCK).length;

  function openCreate(barcode = "") {
    setEditingId(null);
    setForm({ ...emptyForm, barcode });
    setShowFormModal(true);
  }

  function openEdit(product: ProductModel) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      price: product.price.toString(),
      stock: product.stock.toString(),
      category: product.category || "General",
      barcode: product.barcode ?? "",
    });
    setShowFormModal(true);
  }

  async function handleScan(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();

    const code = scanCode.trim();
    setScanCode("");
    if (!code) return;

    const product = products.find((p) => p.barcode === code);

    if (!product) {
      setScanMessage({
        text: t("Código nuevo. Completa los datos del producto."),
        tone: "ok",
      });
      openCreate(code);
      return;
    }

    try {
      await ProductService.update({
        id: product.id,
        name: product.name,
        price: product.price,
        stock: product.stock + 1,
        category: product.category,
        barcode: product.barcode,
      });
      await loadProducts();
      setScanMessage({
        text: t("+1 {{name}}. Stock: {{stock}}", {
          name: product.name,
          stock: product.stock + 1,
        }),
        tone: "ok",
      });
    } catch (error) {
      setScanMessage({ text: String(error), tone: "error" });
    }
  }

  function closeFormModal() {
    setShowFormModal(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const payload = {
      name: form.name,
      price: Number(form.price),
      stock: Number(form.stock),
      category: form.category,
      barcode: form.barcode || null,
    };

    try {
      if (editingId !== null) {
        await ProductService.update({ id: editingId, ...payload });
      } else {
        await ProductService.create(payload);
      }
      await loadProducts();
      closeFormModal();
    } catch (error) {
      console.error("Failed to save product:", error);
      alert(`Error: ${error}`);
    }
  }

  async function handleDelete() {
    if (deletingId === null) return;
    try {
      await ProductService.delete(deletingId);
      await loadProducts();
    } catch (error) {
      console.error("Failed to delete product:", error);
    } finally {
      setDeletingId(null);
    }
  }

  const updateField = (field: keyof ProductForm, value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  return (
    <>
      <PageHeader
        title={t("Inventario")}
        description={t("Gestiona tus productos y stock")}
        actions={
          <button onClick={() => openCreate()} className={btnPrimary}>
            <Plus className="h-4 w-4" />
            {t("Nuevo producto")}
          </button>
        }
      />

      <dl className="grid grid-cols-3 divide-x divide-line rounded-lg border border-line bg-surface">
        <Stat label={t("Productos")} value={products.length} />
        <Stat label={t("Valor del inventario")} value={formatMoney(totalValue)} />
        <Stat
          label={t("Stock bajo")}
          value={lowStock}
          tone={lowStock > 0 ? "warn" : "default"}
        />
      </dl>

      <div className="mt-8 mb-6 flex flex-wrap items-start gap-3">
        <div className="relative max-w-sm flex-1 min-w-56">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder={t("Buscar por nombre o categoría...")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`${inputClass} pl-9`}
          />
        </div>

        <div className="relative w-72 min-w-56">
          <ScanLine className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={scanCode}
            onChange={(e) => setScanCode(e.target.value)}
            onKeyDown={handleScan}
            placeholder={t("Escanear código para sumar stock...")}
            aria-label={t("Escanear código de barras")}
            className={`${inputClass} pl-9`}
          />
          {scanMessage && (
            <p
              role="status"
              className={`mt-2 text-sm ${
                scanMessage.tone === "error" ? "text-danger" : "text-muted"
              }`}
            >
              {scanMessage.text}
            </p>
          )}
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-muted">
            {searchTerm
              ? t("No se encontraron productos")
              : t("No hay productos en el inventario")}
          </p>
          {!searchTerm && (
            <button
              onClick={() => openCreate()}
              className={`${btnSecondary} mt-4`}
            >
              {t("Agregar tu primer producto")}
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-y border-line">
            <thead>
              <tr className="border-b border-line">
                <th className={tableHead}>{t("Producto")}</th>
                <th className={tableHead}>{t("Categoría")}</th>
                <th className={tableHead}>{t("Código")}</th>
                <th className={`${tableHead} text-right`}>{t("Precio")}</th>
                <th className={`${tableHead} text-right`}>{t("Stock")}</th>
                <th className={`${tableHead} text-right`}>{t("Valor total")}</th>
                <th className="w-24" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-hover">
                  <td className={`${tableCell} font-medium`}>{product.name}</td>
                  <td className={`${tableCell} text-muted`}>
                    {t(product.category || "General")}
                  </td>
                  <td className={`${tableCell} text-muted tabular-nums`}>
                    {product.barcode || "—"}
                  </td>
                  <td className={`${tableCell} text-right tabular-nums`}>
                    {formatMoney(product.price)}
                  </td>
                  <td
                    className={`${tableCell} text-right tabular-nums ${
                      product.stock === 0
                        ? "text-danger"
                        : product.stock < LOW_STOCK
                        ? "text-warn"
                        : ""
                    }`}
                  >
                    {product.stock}
                  </td>
                  <td className={`${tableCell} text-right tabular-nums text-muted`}>
                    {formatMoney(product.price * product.stock)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => openEdit(product)}
                        aria-label={t("Editar")}
                        title={t("Editar")}
                        className={`${btnGhost} size-10 px-0`}
                      >
                        <Pencil className="size-full" />
                      </button>
                      <button
                        onClick={() => setDeletingId(product.id)}
                        aria-label={t("Eliminar")}
                        title={t("Eliminar")}
                        className={`${btnGhost} size-10 px-0 hover:text-danger`}
                      >
                        <Trash2 className="size-full" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={showFormModal}
        onClose={closeFormModal}
        title={editingId !== null ? t("Editar producto") : t("Nuevo producto")}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label={t("Nombre del producto")}>
            <input
              type="text"
              required
              autoFocus
              placeholder={t("Ej: Coca-cola 500 ml")}
              className={inputClass}
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
            />
          </Field>

          <Field label={t("Categoría")}>
            <select
              className={inputClass}
              value={form.category}
              onChange={(e) => updateField("category", e.target.value)}
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {t(category)}
                </option>
              ))}
            </select>
          </Field>

          <Field label={t("Código de barras (opcional)")}>
            <input
              type="text"
              placeholder={t("Escanea o escribe el código")}
              value={form.barcode}
              onChange={(e) => updateField("barcode", e.target.value)}
              className={`${inputClass} tabular-nums`}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label={t("Precio")}>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                placeholder="0.00"
                className={`${inputClass} tabular-nums`}
                value={form.price}
                onChange={(e) => updateField("price", e.target.value)}
              />
            </Field>
            <Field label={t("Stock")}>
              <input
                type="number"
                required
                min="0"
                step="1"
                placeholder="0"
                className={`${inputClass} tabular-nums`}
                value={form.stock}
                onChange={(e) => updateField("stock", e.target.value)}
              />
            </Field>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={closeFormModal}
              className={btnSecondary}
            >
              {t("Cancelar")}
            </button>
            <button type="submit" className={btnPrimary}>
              {t("Guardar")}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        title={t("¿Eliminar producto?")}
      >
        <p className="text-sm text-muted">
          {t("Esta acción no se puede deshacer. El producto será eliminado permanentemente del inventario.")}
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setDeletingId(null)}
            className={btnSecondary}
          >
            {t("Cancelar")}
          </button>
          <button type="button" onClick={handleDelete} className={btnDanger}>
            {t("Eliminar")}
          </button>
        </div>
      </Modal>
    </>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}
