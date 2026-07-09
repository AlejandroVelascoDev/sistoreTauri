import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { reportService } from "../api/reportService";
import {
  FileText,
  Search,
  AlertCircle,
  TrendingUp,
  Plus,
  Edit2,
  Trash2,
  Calendar,
} from "lucide-react";
import Modal from "../components/Modal";

export default function Reports() {
  const { t } = useTranslation();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingReport, setEditingReport] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
  });

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await reportService.getAll();
      setReports(data);
    } catch (error) {
      console.error("Error cargando reportes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await reportService.create(formData);
      await loadReports();
      closeModal();
    } catch (error) {
      console.error("Error creando reporte:", error);
    }
  };

  const handleUpdate = async () => {
    try {
      await reportService.update({
        id: editingReport.id,
        ...formData,
      });
      await loadReports();
      closeModal();
    } catch (error) {
      console.error("Error actualizando reporte:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm(t("¿Estás seguro de eliminar este reporte?"))) {
      try {
        await reportService.delete(id);
        await loadReports();
      } catch (error) {
        console.error("Error eliminando reporte:", error);
      }
    }
  };

  const openCreateModal = () => {
    setEditingReport(null);
    setFormData({ name: "", category: "", description: "" });
    setShowModal(true);
  };

  const openEditModal = (report: any) => {
    setEditingReport(report);
    setFormData({
      name: report.name,
      category: report.category,
      description: report.description,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingReport(null);
    setFormData({ name: "", category: "", description: "" });
  };

  const handleSubmit = () => {
    if (editingReport) {
      handleUpdate();
    } else {
      handleCreate();
    }
  };

  const filteredReports = reports.filter(
    (report) =>
      report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = [...new Set(reports.map((r) => r.category))];

  const inputClass =
    "w-full px-4 py-2.5 bg-card border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";

  return (
    <div className="min-h-screen">
      {/* Topbar */}
      <div className="h-16 border-b border-border bg-card px-8 flex items-center justify-between sticky top-0 z-10">
        <h2 className="text-lg font-semibold text-foreground tracking-tight">
          {t("Reportes")}
        </h2>
        <button
          onClick={openCreateModal}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          {t("Nuevo Reporte")}
        </button>
      </div>

      <div className="p-8">
        <div className="mb-6">
          <p className="text-muted-foreground">
            {t("Gestiona y visualiza tus reportes")}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          <div className="bg-card rounded-xl p-5 border border-border">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">
                  {t("Total Reportes")}
                </p>
                <p className="text-2xl font-semibold text-foreground tracking-tight">
                  {reports.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl p-5 border border-border">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">
                  {t("Categorías")}
                </p>
                <p className="text-2xl font-semibold text-foreground tracking-tight">
                  {categories.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl p-5 border border-border">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">{t("Este mes")}</p>
                <p className="text-2xl font-semibold text-foreground tracking-tight">
                  {
                    reports.filter((r) => {
                      const date = new Date(r.created_at);
                      const now = new Date();
                      return date.getMonth() === now.getMonth();
                    }).length
                  }
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
              placeholder={t("Buscar reportes...")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-card border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>
        </div>

        {/* Reports Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-muted-foreground mt-4 text-sm">
                {t("Cargando reportes...")}
              </p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="p-12 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-muted-foreground">
                {t("No se encontraron reportes")}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/40 border-b border-border">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("Nombre")}
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("Categoría")}
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("Descripción")}
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("Fecha")}
                    </th>
                    <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("Acciones")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredReports.map((report) => (
                    <tr
                      key={report.id}
                      className="hover:bg-muted/40 transition-colors"
                    >
                      <td className="px-6 py-4 text-foreground font-medium">
                        {report.name}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-primary/10 text-primary rounded-md text-xs font-medium">
                          {report.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-sm">
                        {report.description}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-sm">
                        {new Date(report.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(report)}
                            className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(report.id)}
                            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={closeModal}
          title={editingReport ? t("Editar Reporte") : t("Nuevo Reporte")}
          size="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                {t("Nombre del Reporte")}
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className={inputClass}
                placeholder={t("Ej: Reporte mensual")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                {t("Categoría")}
              </label>
              <input
                type="text"
                required
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className={inputClass}
                placeholder={t("Finanzas")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                {t("Descripción")}
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className={`${inputClass} resize-none`}
                placeholder={t("Describe el reporte...")}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 px-4 py-2.5 bg-muted hover:bg-border text-foreground rounded-lg transition-colors font-medium"
              >
                {t("Cancelar")}
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors font-medium"
              >
                {editingReport ? t("Actualizar") : t("Crear")}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
