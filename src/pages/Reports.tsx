import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { reportService, type Report } from "../api/reportService";
import Modal from "../components/Modal";
import PageHeader from "../components/PageHeader";
import Stat from "../components/Stat";
import { parseDate } from "../lib/format";
import {
  btnDanger,
  btnGhost,
  btnPrimary,
  btnSecondary,
  inputClass,
  tableCell,
  tableHead,
} from "../lib/ui";

type ReportForm = {
  name: string;
  category: string;
  description: string;
};

const emptyForm: ReportForm = { name: "", category: "", description: "" };

export default function Reports() {
  const { t } = useTranslation();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState<ReportForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadReports = async () => {
    try {
      setLoading(true);
      setReports(await reportService.getAll());
    } catch (error) {
      console.error("Error cargando reportes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const filteredReports = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return reports.filter(
      (r) =>
        r.name.toLowerCase().includes(term) ||
        (r.category ?? "").toLowerCase().includes(term)
    );
  }, [reports, searchTerm]);

  const categoryCount = new Set(reports.map((r) => r.category)).size;
  const now = new Date();
  const thisMonth = reports.filter((r) => {
    const date = parseDate(r.created_at);
    return (
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  }).length;

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowFormModal(true);
  };

  const openEdit = (report: Report) => {
    setEditingId(report.id);
    setForm({
      name: report.name,
      category: report.category ?? "",
      description: report.description ?? "",
    });
    setShowFormModal(true);
  };

  const closeFormModal = () => setShowFormModal(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editingId !== null) {
        await reportService.update({ id: editingId, ...form });
      } else {
        await reportService.create(form);
      }
      await loadReports();
      closeFormModal();
    } catch (error) {
      console.error("Error guardando reporte:", error);
    }
  };

  const handleDelete = async () => {
    if (deletingId === null) return;
    try {
      await reportService.delete(deletingId);
      await loadReports();
    } catch (error) {
      console.error("Error eliminando reporte:", error);
    } finally {
      setDeletingId(null);
    }
  };

  const updateField = (field: keyof ReportForm, value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  return (
    <>
      <PageHeader
        title={t("Reportes")}
        description={t("Gestiona y visualiza tus reportes")}
        actions={
          <button onClick={openCreate} className={btnPrimary}>
            <Plus className="h-4 w-4" />
            {t("Nuevo reporte")}
          </button>
        }
      />

      <dl className="grid grid-cols-3 divide-x divide-line rounded-lg border border-line bg-surface">
        <Stat label={t("Total reportes")} value={reports.length} />
        <Stat label={t("Categorías")} value={categoryCount} />
        <Stat label={t("Este mes")} value={thisMonth} />
      </dl>

      <div className="relative mt-8 mb-4 max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="text"
          placeholder={t("Buscar reportes...")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`${inputClass} pl-9`}
        />
      </div>

      {loading ? (
        <p className="py-16 text-center text-sm text-muted">
          {t("Cargando reportes...")}
        </p>
      ) : filteredReports.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted">
          {t("No se encontraron reportes")}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-y border-line">
            <thead>
              <tr className="border-b border-line">
                <th className={tableHead}>{t("Nombre")}</th>
                <th className={tableHead}>{t("Categoría")}</th>
                <th className={tableHead}>{t("Descripción")}</th>
                <th className={tableHead}>{t("Fecha")}</th>
                <th className="w-24" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredReports.map((report) => (
                <tr key={report.id} className="hover:bg-hover">
                  <td className={`${tableCell} font-medium`}>{report.name}</td>
                  <td className={`${tableCell} text-muted`}>{report.category}</td>
                  <td className={`${tableCell} max-w-xs truncate text-muted`}>
                    {report.description}
                  </td>
                  <td className={`${tableCell} text-muted tabular-nums`}>
                    {parseDate(report.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => openEdit(report)}
                        aria-label={t("Editar")}
                        title={t("Editar")}
                        className={`${btnGhost} h-8 w-8 px-0`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingId(report.id)}
                        aria-label={t("Eliminar")}
                        title={t("Eliminar")}
                        className={`${btnGhost} h-8 w-8 px-0 hover:text-danger`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
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
        title={editingId !== null ? t("Editar reporte") : t("Nuevo reporte")}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label={t("Nombre del reporte")}>
            <input
              type="text"
              required
              autoFocus
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              className={inputClass}
              placeholder={t("Ej: Reporte mensual")}
            />
          </Field>

          <Field label={t("Categoría")}>
            <input
              type="text"
              required
              value={form.category}
              onChange={(e) => updateField("category", e.target.value)}
              className={inputClass}
              placeholder={t("Finanzas")}
            />
          </Field>

          <Field label={t("Descripción")}>
            <textarea
              required
              rows={3}
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              className={`${inputClass} h-auto resize-none py-2`}
              placeholder={t("Describe el reporte...")}
            />
          </Field>

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
        title={t("¿Eliminar reporte?")}
      >
        <p className="text-sm text-muted">
          {t("Esta acción no se puede deshacer.")}
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
