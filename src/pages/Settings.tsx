import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Palette,
  Globe,
  Bell,
  Shield,
  User,
  Monitor,
  Moon,
  Sun,
  Database,
  ChevronRight,
} from "lucide-react";

export default function Settings() {
  const { t, i18n } = useTranslation();
  const [theme, setTheme] = useState("dark");
  const [notifications, setNotifications] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);

  const setLanguage = (language: string) => {
    i18n.changeLanguage(language);
  };

  const settingsSections = [
    {
      title: t("Apariencia"),
      icon: Palette,
      items: [
        {
          label: t("Tema"),
          description: t("Personaliza el aspecto visual de la aplicación"),
          type: "theme",
          value: theme,
          onChange: setTheme,
        },
      ],
    },
    {
      title: t("Idioma y Región"),
      icon: Globe,
      items: [
        {
          label: t("Idioma"),
          description: t("Selecciona el idioma de la interfaz"),
          type: "language",
          value: i18n.language,
          onChange: setLanguage,
        },
      ],
    },
    {
      title: t("Notificaciones"),
      icon: Bell,
      items: [
        {
          label: t("Notificaciones push"),
          description: t("Recibe alertas de ventas y actualizaciones"),
          type: "toggle",
          value: notifications,
          onChange: setNotifications,
        },
        {
          label: t("Efectos de sonido"),
          description: t("Reproducir sonidos en acciones importantes"),
          type: "toggle",
          value: soundEffects,
          onChange: setSoundEffects,
        },
      ],
    },
    {
      title: t("Seguridad"),
      icon: Shield,
      items: [
        {
          label: t("Autenticación de dos factores"),
          description: t("Añade una capa extra de seguridad"),
          type: "link",
        },
        {
          label: t("Cambiar contraseña"),
          description: t("Actualiza tu contraseña periódicamente"),
          type: "link",
        },
      ],
    },
    {
      title: t("Cuenta"),
      icon: User,
      items: [
        {
          label: t("Perfil de usuario"),
          description: t("Administra tu información personal"),
          type: "link",
        },
        {
          label: t("Preferencias de datos"),
          description: t("Controla cómo se usan tus datos"),
          type: "link",
        },
      ],
    },
  ];

  const themes = [
    { value: "light", label: t("Claro"), icon: Sun },
    { value: "dark", label: t("Oscuro"), icon: Moon },
    { value: "system", label: t("Sistema"), icon: Monitor },
  ];

  const languages = [
    { value: "es", label: t("Español"), flag: "🇪🇸" },
    { value: "en", label: t("Inglés"), flag: "🇺🇸" },
  ];

  return (
    <div className="bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 p-8 overflow-y-auto min-h-screen">
      <div className="mb-8">
        <h2 className="text-4xl font-bold bg-linear-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
          {t("Ajustes")}
        </h2>
        <p className="text-gray-400">{t("Personaliza tu experiencia en SisStore")}</p>
      </div>

      <div className="space-y-6">
        {settingsSections.map((section) => {
          const SectionIcon = section.icon;
          return (
            <div
              key={section.title}
              className="bg-linear-to-br from-slate-800 to-slate-900 rounded-2xl shadow-xl border border-slate-700/50 overflow-hidden hover:border-slate-600/50 transition-all duration-300"
            >
              <div className="px-6 py-4 border-b border-slate-700/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                    <SectionIcon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    {section.title}
                  </h3>
                </div>
              </div>

              <div className="divide-y divide-slate-700/30">
                {section.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="px-6 py-5 hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-white mb-1">
                          {item.label}
                        </h4>
                        <p className="text-sm text-gray-400">
                          {item.description}
                        </p>
                      </div>

                      {item.type === "theme" && (
                        <div className="flex gap-2">
                          {themes.map((t) => {
                            const ThemeIcon = t.icon;
                            return (
                              <button
                                key={t.value}
                                onClick={() => item.onChange?.(t.value)}
                                className={`
                                  px-3 py-2 rounded-lg flex items-center gap-2 transition-all text-sm font-medium
                                  ${
                                    item.value === t.value
                                      ? "bg-linear-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30"
                                      : "bg-slate-700/50 text-gray-300 hover:bg-slate-700 border border-slate-600/50"
                                  }
                                `}
                              >
                                <ThemeIcon className="w-4 h-4" />
                                {t.label}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {item.type === "language" && (
                        <div className="flex gap-2">
                          {languages.map((lang) => (
                            <button
                              key={lang.value}
                              onClick={() => item.onChange?.(lang.value)}
                              className={`
                                px-3 py-2 rounded-lg flex items-center gap-2 transition-all text-sm font-medium
                                ${
                                  item.value === lang.value
                                    ? "bg-linear-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30"
                                    : "bg-slate-700/50 text-gray-300 hover:bg-slate-700 border border-slate-600/50"
                                }
                              `}
                            >
                              <span className="text-base">{lang.flag}</span>
                              {lang.label}
                            </button>
                          ))}
                        </div>
                      )}

                      {item.type === "toggle" && (
                        <button
                          onClick={() => item.onChange?.(!item.value)}
                          className={`
                            relative w-14 h-7 rounded-full transition-all duration-300
                            ${
                              item.value
                                ? "bg-linear-to-r from-blue-600 to-purple-600 shadow-lg shadow-blue-500/30"
                                : "bg-slate-700"
                            }
                          `}
                        >
                          <div
                            className={`
                              absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full
                              transition-transform shadow-md
                              ${item.value ? "translate-x-7" : "translate-x-0"}
                            `}
                          />
                        </button>
                      )}

                      {item.type === "link" && (
                        <button className="p-2 rounded-lg hover:bg-slate-800 transition-colors border border-slate-600/50 hover:border-slate-500">
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 bg-linear-to-br from-red-950/30 to-red-900/20 rounded-2xl border-2 border-red-900/50 p-6 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-linear-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-lg">
            <Database className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-red-400 mb-1">
              {t("Zona de peligro")}
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              {t("Estas acciones son irreversibles. Procede con precaución.")}
            </p>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-slate-700/50 border border-red-900/50 text-red-400 rounded-lg hover:bg-red-950/50 transition-all text-sm font-medium">
                {t("Limpiar datos locales")}
              </button>
              <button className="px-4 py-2 bg-linear-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-500 hover:to-red-600 transition-all text-sm font-medium shadow-lg shadow-red-500/30">
                {t("Eliminar cuenta")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
