import client from "./client";

export const listExamSessions = async (params = {}) => (await client.get("/exams/sessions", { params })).data;
export const createExamSession = async (payload) => (await client.post("/exams/sessions", payload)).data;
export const deleteExamSession = async (id) => (await client.delete(`/exams/sessions/${id}`)).data;
export const requestExam = async (examSessionId) =>
  (await client.post("/exams/registrations", { exam_session_id: examSessionId })).data;
export const myRegistrations = async () => (await client.get("/exams/registrations/me")).data;
export const allRegistrations = async () => (await client.get("/exams/registrations")).data;
export const reviewRegistration = async (id, status) =>
  (await client.put(`/exams/registrations/${id}`, { status })).data;
