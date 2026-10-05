import client from "./client";

// /auth/login attend un formulaire OAuth2 (form-data), pas du JSON
export const login = async (phone, password) => {
  const form = new URLSearchParams();
  form.append("username", phone);
  form.append("password", password);
  return (await client.post("/auth/login", form, { headers: { "Content-Type": "application/x-www-form-urlencoded" } })).data;
};
export const getMe = async () => (await client.get("/auth/me")).data;
export const changePassword = async (old_password, new_password) =>
  (await client.post("/auth/change-password", { old_password, new_password })).data;
export const impersonate = async (id) => (await client.post(`/auth/impersonate/${id}`)).data;
export const stopImpersonate = async () => (await client.post("/auth/stop-impersonate")).data;
