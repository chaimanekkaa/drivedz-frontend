import client from "./client";

export const listVehicles = async () => (await client.get("/vehicles/")).data;
export const createVehicle = async (payload) => (await client.post("/vehicles/", payload)).data;
export const updateVehicle = async (id, payload) => (await client.put(`/vehicles/${id}`, payload)).data;
export const deleteVehicle = async (id) => (await client.delete(`/vehicles/${id}`)).data;
