import client from "./client";

export const listSessions = async (params = {}) => (await client.get("/planning/", { params })).data;
export const createSession = async (payload) => (await client.post("/planning/", payload)).data;
export const updateSession = async (id, payload) => (await client.put(`/planning/${id}`, payload)).data;
export const completeSession = async (id, attendances) =>
  (await client.post(`/planning/${id}/complete`, { attendances })).data;
export const reopenSession = async (id) => (await client.post(`/planning/${id}/reopen`)).data;
export const cancelSession = async (id) => (await client.post(`/planning/${id}/cancel`)).data;
export const deleteSession = async (id) => (await client.delete(`/planning/${id}`)).data;
