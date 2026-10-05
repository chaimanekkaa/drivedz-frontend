import client from "./client";

export const getPricing = async () => (await client.get("/settings/pricing")).data;
export const updatePricing = async (payload) => (await client.put("/settings/pricing", payload)).data;
export const getInfo = async () => (await client.get("/settings/info")).data;
export const updateInfo = async (payload) => (await client.put("/settings/info", payload)).data;
