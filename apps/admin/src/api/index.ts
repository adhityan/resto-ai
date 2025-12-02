import axios from "axios";
import { API_BASE_URL, ACCESS_TOKEN_STORAGE_KEY } from "@/config/constants";

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: false,
});

// Add request interceptor to attach token to every request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
