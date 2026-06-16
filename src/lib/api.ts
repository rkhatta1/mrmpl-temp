// @ts-nocheck
import axios from "axios";
import { getPublicApiBaseUrl } from "./api-base-url";

const api = axios.create({
  baseURL: getPublicApiBaseUrl(),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
