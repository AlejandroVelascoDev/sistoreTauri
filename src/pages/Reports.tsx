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
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
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

  const handleDelete = async (id) => {
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

  const openEditModal = (report) => {
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

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-4xl font-bold bg-linear-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
          {t("Reportes")}
        </h2>
        <p className="text-gray-400">{t("Gestiona y visualiza tus reportes")}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-linear-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700/50 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-linear-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">{t("Total Reportes")}</p>
              <p className="text-3xl font-bold text-white">{reports.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-linear-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700/50 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-linear-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">{t("Categorías")}</p>
              <p className="text-3xl font-bold text-white">
                {categories.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-linear-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700/50 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-linear-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">{t("Este mes")}</p>
              <p className="text-3xl font-bold text-white">
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
      <div className="bg-linear-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700/50 shadow-xl mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full md:w-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={t("Buscar reportes...")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <button
            onClick={openCreateModal}
            className="bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 shadow-lg shadow-blue-500/30 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {t("Nuevo Reporte")}
          </button>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-linear-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400 mt-4">{t("Cargando reportes...")}</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">{t("No se encontraron reportes")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/50 border-b border-slate-700/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    {t("Nombre")}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    {t("Categoría")}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    {t("Descripción")}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    {t("Fecha")}
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">
                    {t("Acciones")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {filteredReports.map((report) => (
                  <tr
                    key={report.id}
                    className="hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-white font-medium">
                      {report.name}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm">
                        {report.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {report.description}
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">
                      {new Date(report.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(report)}
                          className="p-2 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(report.id)}
                          className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
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

      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={closeModal}
          title={editingReport ? t("Editar Reporte") : t("Nuevo Reporte")}
          size="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t("Nombre del Reporte")}
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder={t("Ej: Reporte mensual")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t("Categoría")}
              </label>
              <input
                type="text"
                required
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder={t("Finanzas")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t("Descripción")}
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                placeholder={t("Describe el reporte...")}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 px-4 py-3 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-600/50"
              >
                {t("Cancelar")}
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg transition-all shadow-lg shadow-blue-500/30"
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
