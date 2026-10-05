import client from "./client";

export const createPayment = async (payload) => (await client.post("/payments/", payload)).data;
export const listPayments = async (studentId) => (await client.get(`/payments/${studentId}`)).data;
