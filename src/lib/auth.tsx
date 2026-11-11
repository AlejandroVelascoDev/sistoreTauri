import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { AuthUser } from "../api/authService";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  signIn: (user: AuthUser) => Promise<void>;
  signOut: () => Promise<void>;
};
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const generation = useRef(0);
  useEffect(() => {
    const id = ++generation.current;
    invoke<AuthUser | null>("auth_session")
      .then((session) => { if (id === generation.current) setUser(session); })
      .catch(() => { if (id === generation.current) setUser(null); })
      .finally(() => { if (id === generation.current) setLoading(false); });
    return () => { ++generation.current; };
  }, []);
  const signIn = async (_next: AuthUser) => {
    ++generation.current;
    const session = await invoke<AuthUser | null>("auth_session");
    if (!session) throw new Error("Inicia sesión para continuar");
    setUser(session);
    setLoading(false);
  };
  const signOut = async () => {
    ++generation.current;
    try {
      await invoke("auth_logout");
      setUser(null);
    } catch (error) {
      alert(String(error));
    }
  };
  return <AuthContext.Provider value={{ user, loading, signIn, signOut }}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
