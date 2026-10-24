import axios from "axios";

export const crmApi = axios.create({
  baseURL: "/api/crm",
  headers: { Accept: "application/json" },
});
