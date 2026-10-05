import client from "./client";

export const listNotifications = async () => (await client.get("/notifications/")).data;
export const markRead = async (id) => (await client.post(`/notifications/${id}/read`)).data;
export const markAllRead = async () => (await client.post("/notifications/read-all")).data;
