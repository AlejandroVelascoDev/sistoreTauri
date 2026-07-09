import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertCircle,
  X,
  TrendingUp,
  TrendingDown,
  DollarSign,
} from "lucide-react";
import { ProductService } from "../api/productService";

export default function Inventory() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<any>(null);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("General");

  async function loadProducts() {
    try {
      const result = await ProductService.getAll();
      setProducts(result);
      setFilteredProducts(result);
    } catch (error) {
      console.error("Failed to load products:", error);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    const filtered = products.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      if (editingProduct) {
        await ProductService.update({
          id: editingProduct.id,
          name,
          price: Number(price),
          stock: Number(stock),
          category,
        });
      } else {
        await ProductService.create({
          name,
          price: Number(price),
          stock: Number(stock),
          category,
        });
      }

      await loadProducts();
      closeModal();
    } catch (error) {
      console.error("Failed to save product:", error);
      alert(`Error: ${error}`);
    }
  }

  function openModal(product: any = null) {
    if (product) {
      setEditingProduct(product);
      setName(product.name);
      setPrice(product.price.toString());
      setStock(product.stock.toString());
      setCategory(product.category || "General");
    } else {
      setEditingProduct(null);
      setName("");
      setPrice("");
      setStock("");
      setCategory("General");
    }
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingProduct(null);
    setName("");
    setPrice("");
    setStock("");
    setCategory("General");
  }

  async function handleDelete(id: number) {
    try {
      await ProductService.delete(id);
      await loadProducts();
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error("Failed to delete product:", error);
    }
  }

  const totalProducts = products.length;
  const totalValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);
  const lowStock = products.filter((p) => p.stock < 10).length;

  const inputClass =
    "w-full px-4 py-2.5 bg-card border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";

  return (
    <div className="min-h-screen">
      {/* Topbar */}
      <div className="h-16 border-b border-border bg-card px-8 flex items-center justify-between sticky top-0 z-10">
        <h2 className="text-lg font-semibold text-foreground tracking-tight">
          {t("Inventario")}
        </h2>
        <button
          onClick={() => openModal()}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          {t("Nuevo Producto")}
        </button>
      </div>

      <div className="p-8">
        <div className="mb-6">
          <p className="text-muted-foreground">
            {t("Gestiona tus productos y stock")}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          <div className="bg-card rounded-xl p-5 border border-border">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">
                  {t("Total Productos")}
                </p>
                <p className="text-2xl font-semibold text-foreground tracking-tight">
                  {totalProducts}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl p-5 border border-border">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">
                  {t("Valor Inventario")}
                </p>
                <p className="text-2xl font-semibold text-foreground tracking-tight">
                  ${totalValue.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl p-5 border border-border">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">{t("Stock Bajo")}</p>
                <p className="text-2xl font-semibold text-foreground tracking-tight">
                  {lowStock}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="mb-5">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-[18px] h-[18px]" />
            <input
              type="text"
              placeholder={t("Buscar por nombre o categoría...")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-card border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            {filteredProducts.length === 0 ? (
              <div className="p-12 text-center">
                <Package className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm
                    ? t("No se encontraron productos")
                    : t("No hay productos en el inventario")}
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => openModal()}
                    className="mt-4 text-primary hover:text-primary/80 font-medium text-sm"
                  >
                    {t("Agregar tu primer producto")}
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("ID")}
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("Producto")}
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("Categoría")}
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("Precio")}
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("Stock")}
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("Valor Total")}
                    </th>
                    <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("Acciones")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="hover:bg-muted/40 transition-colors"
                    >
                      <td className="px-6 py-4 text-muted-foreground text-sm">
                        #{product.id}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-muted rounded-lg flex items-center justify-center">
                            <Package className="w-[18px] h-[18px] text-muted-foreground" />
                          </div>
                          <span className="text-foreground font-medium">
                            {product.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-muted text-muted-foreground rounded-md text-xs font-medium">
                          {product.category || "General"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-foreground font-semibold">
                        ${product.price.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                              product.stock > 50
                                ? "bg-primary/10 text-primary"
                                : product.stock > 10
                                ? "bg-warning/10 text-warning"
                                : "bg-destructive/10 text-destructive"
                            }`}
                          >
                            {product.stock} {t("unidades")}
                          </span>
                          {product.stock > 50 ? (
                            <TrendingUp className="w-4 h-4 text-primary" />
                          ) : product.stock <= 10 ? (
                            <TrendingDown className="w-4 h-4 text-destructive" />
                          ) : null}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-foreground font-semibold">
                        ${(product.price * product.stock).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openModal(product)}
                            className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            title={t("Editar")}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(product.id)}
                            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                            title={t("Eliminar")}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Modal Create/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-card rounded-2xl border border-border w-full max-w-md shadow-2xl animate-modal-appear">
            <div className="px-6 py-5 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">
                {editingProduct ? t("Editar Producto") : t("Nuevo Producto")}
              </h3>
              <button
                onClick={closeModal}
                className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                aria-label={t("Cancelar")}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-foreground text-sm font-medium mb-1.5">
                  {t("Nombre del producto")}
                </label>
                <input
                  type="text"
                  placeholder={t("Ej: Coca-cola 500 ml")}
                  className={inputClass}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-foreground text-sm font-medium mb-1.5">
                  {t("Categoría")}
                </label>
                <select
                  className={inputClass}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="General">{t("Bebidas")}</option>
                  <option value="Electrónica">{t("Empaquetados")}</option>
                  <option value="Accesorios">{t("Refrigerados")}</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-foreground text-sm font-medium mb-1.5">
                    {t("Precio")}
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    className={inputClass}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-foreground text-sm font-medium mb-1.5">
                    {t("Stock")}
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    className={inputClass}
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-muted hover:bg-border text-foreground font-medium py-2.5 px-4 rounded-lg transition-colors"
                >
                  {t("Cancelar")}
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2.5 px-4 rounded-lg transition-colors"
                >
                  {editingProduct ? t("Actualizar") : t("Crear")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-card rounded-2xl border border-border w-full max-w-md shadow-2xl p-6 animate-modal-appear">
            <div className="w-14 h-14 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold text-foreground text-center mb-1">
              {t("¿Eliminar producto?")}
            </h3>
            <p className="text-muted-foreground text-center text-sm mb-6">
              {t(
                "Esta acción no se puede deshacer. El producto será eliminado permanentemente del inventario."
              )}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 bg-muted hover:bg-border text-foreground font-medium py-2.5 px-4 rounded-lg transition-colors"
              >
                {t("Cancelar")}
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-medium py-2.5 px-4 rounded-lg transition-colors"
              >
                {t("Eliminar")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
