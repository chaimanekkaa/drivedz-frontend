import client from "./client";

export const createUser = async (payload) => (await client.post("/users/", payload)).data;
export const listStudents = async (params = {}) => (await client.get("/users/students", { params })).data;
export const listInstructors = async () => (await client.get("/users/instructors")).data;
export const getProgress = async (id) => (await client.get(`/users/${id}/progress`)).data;
export const validatePhase = async (id) => (await client.post(`/users/${id}/validate-phase`)).data;
export const setPhase = async (id, phase) => (await client.put(`/users/${id}/phase`, { phase })).data;
export const resetPassword = async (id, new_password) =>
  (await client.post(`/users/${id}/reset-password`, { new_password })).data;
