import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export const getToken = () => localStorage.getItem("token") || sessionStorage.getItem("token");
export const clearToken = () => {
  localStorage.removeItem("token");
  sessionStorage.removeItem("token");
};
// Garde le token là où il était (localStorage = "rester connecté", sinon sessionStorage)
export const saveToken = (token, remember) => {
  const useLocal = remember ?? !!localStorage.getItem("token");
  clearToken();
  (useLocal ? localStorage : sessionStorage).setItem("token", token);
};

const client = axios.create({ baseURL: API_URL });

client.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (r) => r,
  (err) => {
    const isLogin = err?.config?.url?.includes("/auth/login");
    if (err?.response?.status === 401 && !isLogin) {
      clearToken();
      window.dispatchEvent(new Event("auth:expired"));
    }
    return Promise.reject(err);
  }
);

export default client;
