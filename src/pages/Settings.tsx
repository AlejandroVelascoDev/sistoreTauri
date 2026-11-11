import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { applyTheme, getStoredTheme, type Theme } from "../lib/theme";
import { applyZoom, getStoredZoom, ZOOM_LEVELS, type ZoomLevel } from "../lib/zoom";
import PageHeader from "../components/PageHeader";
import Segmented from "../components/Segmented";
import { btnDanger, btnGhost } from "../lib/ui";

const themes: { value: Theme; label: string }[] = [
  { value: "light", label: "Claro" },
  { value: "dark", label: "Oscuro" },
  { value: "system", label: "Sistema" },
];

const languages = [
  { value: "es", label: "Español" },
  { value: "en", label: "English" },
];

export default function Settings() {
  const { t, i18n } = useTranslation();
  const [theme, setTheme] = useState<Theme>(getStoredTheme);
  const [zoom, setZoom] = useState<ZoomLevel>(getStoredZoom);
  const [notifications, setNotifications] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);

  const changeTheme = (value: Theme) => {
    setTheme(value);
    applyTheme(value);
  };

  return (
    <>
      <PageHeader
        title={t("Ajustes")}
        description={t("Personaliza tu experiencia en SisStore")}
      />

      <div className="space-y-10">
        <Section title={t("Apariencia")}>
          <Row
            label={t("Tema")}
            description={t("Cambia entre claro, oscuro o el del sistema")}
          >
            <Segmented
              value={theme}
              options={themes.map((item) => ({
                value: item.value,
                label: t(item.label),
              }))}
              onChange={changeTheme}
            />
          </Row>
          <Row
            label={t("Zoom")}
            description={t("Tamaño de textos y controles. También puedes usar Ctrl/⌘ + y Ctrl/⌘ −.")}
          >
            <Segmented
              value={String(zoom)}
              options={ZOOM_LEVELS.map((level) => ({
                value: String(level),
                label: `${level}%`,
              }))}
              onChange={(value) => {
                const level = Number(value) as ZoomLevel;
                setZoom(level);
                applyZoom(level);
              }}
            />
          </Row>
        </Section>

        <Section title={t("Idioma y región")}>
          <Row
            label={t("Idioma")}
            description={t("Selecciona el idioma de la interfaz")}
          >
            <Segmented
              value={i18n.language}
              options={languages}
              onChange={(value) => { localStorage.setItem("language", value); void i18n.changeLanguage(value); }}
            />
          </Row>
        </Section>

        <Section title={t("Notificaciones")}>
          <Row
            label={t("Notificaciones push")}
            description={t("Recibe alertas de ventas y actualizaciones")}
          >
            <Switch label={t("Notificaciones push")} checked={notifications} onChange={setNotifications} />
          </Row>
          <Row
            label={t("Efectos de sonido")}
            description={t("Reproducir sonidos en acciones importantes")}
          >
            <Switch label={t("Efectos de sonido")} checked={soundEffects} onChange={setSoundEffects} />
          </Row>
        </Section>

        <Section title={t("Cuenta")}>
          <Row
            label={t("Cambiar contraseña")}
            description={t("Actualiza tu contraseña periódicamente")}
          >
            <button className={btnGhost}>{t("Cambiar")}</button>
          </Row>
          <Row
            label={t("Perfil de usuario")}
            description={t("Administra tu información personal")}
          >
            <button className={btnGhost}>{t("Editar")}</button>
          </Row>
        </Section>

        <Section title={t("Zona de peligro")}>
          <Row
            label={t("Limpiar datos locales")}
            description={t("Estas acciones son irreversibles. Procede con precaución.")}
          >
            <button className={btnDanger}>{t("Limpiar datos")}</button>
          </Row>
        </Section>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold">{title}</h2>
      <div className="divide-y divide-line border-y border-line">{children}</div>
    </section>
  );
}

function Row({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-0.5 text-sm text-muted">{description}</p>
      </div>
      {children}
    </div>
  );
}

function Switch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-label={label}
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
        checked ? "bg-accent" : "bg-line"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-surface shadow-sm transition-transform duration-200 ${
          checked ? "translate-x-5" : ""
        }`}
      />
    </button>
  );
}
