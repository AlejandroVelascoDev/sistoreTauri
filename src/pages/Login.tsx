import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AuthService } from "../api/authService";
import { useAuth } from "../lib/auth";
import { btnPrimary, inputClass } from "../lib/ui";

export default function Login() {
  const { t } = useTranslation();
  const { user, signIn } = useAuth();
  const navigate = useNavigate();

  const [setupMode, setSetupMode] = useState<boolean | null>(null);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setSetupMode(!(await AuthService.hasUsers()));
      } catch (err) {
        setError(String(err));
        setSetupMode(false);
      }
    })();
  }, []);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (setupMode && password !== confirmPassword) {
      setError(t("Las contraseñas no coinciden"));
      return;
    }

    setSubmitting(true);
    try {
      const session = setupMode
        ? await AuthService.register({ username, display_name: displayName, password })
        : await AuthService.login({ username, password });
      signIn(session);
      navigate("/", { replace: true });
    } catch (err) {
      setError(String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-6">
      <div className="anim-page w-full max-w-sm">
        <p className="mb-8 text-base font-semibold tracking-tight">SisStore</p>

        {setupMode === null ? null : (
          <>
            <h1 className="text-2xl font-semibold tracking-tight">
              {setupMode ? t("Crear cuenta de administrador") : t("Iniciar sesión")}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {setupMode
                ? t("Primer inicio: crea el usuario que administrará la tienda")
                : t("Ingresa con tu usuario para continuar")}
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <Field label={t("Usuario")}>
                <input
                  type="text"
                  required
                  autoFocus
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={inputClass}
                />
              </Field>

              {setupMode && (
                <Field label={t("Nombre para mostrar")}>
                  <input
                    type="text"
                    autoComplete="name"
                    placeholder={t("Ej: María López")}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className={inputClass}
                  />
                </Field>
              )}

              <Field label={t("Contraseña")}>
                <input
                  type="password"
                  required
                  minLength={setupMode ? 6 : undefined}
                  autoComplete={setupMode ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                />
              </Field>

              {setupMode && (
                <Field label={t("Repetir contraseña")}>
                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={inputClass}
                  />
                </Field>
              )}

              {error && (
                <p role="alert" className="text-sm text-danger">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className={`${btnPrimary} h-11 w-full`}
              >
                {setupMode ? t("Crear cuenta") : t("Entrar")}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
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
