import { createContext, useCallback, useContext, useEffect, useState } from "react";
import * as authApi from "../api/auth";
import { clearToken, getToken, saveToken } from "../api/client";

const AuthContext = createContext(null);

function decodeJwt(token) {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getToken());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!getToken());
  const [impersonating, setImpersonating] = useState(false);

  const logout = useCallback(() => {
    clearToken();
    setToken(null);
    setUser(null);
    setImpersonating(false);
  }, []);

  // Session expirée détectée par l'intercepteur axios (401)
  useEffect(() => {
    const onExpired = () => logout();
    window.addEventListener("auth:expired", onExpired);
    return () => window.removeEventListener("auth:expired", onExpired);
  }, [logout]);

  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const me = await authApi.getMe();
        if (cancelled) return;
        setUser(me);
        setImpersonating(!!decodeJwt(token)?.real_user_id);
      } catch {
        if (!cancelled) logout();
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    bootstrap();
    return () => { cancelled = true; };
  }, [token, logout]);

  const login = async (phone, password, remember = true) => {
    const res = await authApi.login(phone, password);
    saveToken(res.access_token, remember);
    setToken(res.access_token);
    return res;
  };

  const startImpersonate = async (instructorId) => {
    const res = await authApi.impersonate(instructorId);
    saveToken(res.access_token);
    setToken(res.access_token);
  };

  const stopImpersonate = async () => {
    const res = await authApi.stopImpersonate();
    saveToken(res.access_token);
    setToken(res.access_token);
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, impersonating, login, logout, startImpersonate, stopImpersonate }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
