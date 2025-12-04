import axios, { AxiosError, type AxiosInstance } from "axios";

const TIMEOUT_MS = 10000;

/**
 * Creates an axios instance configured for the reservation API.
 */
export function createApiClient(apiKey: string): AxiosInstance {
    const baseURL = process.env.RESTO_API_URL;
    if (!baseURL) {
        throw new Error("RESTO_API_URL environment variable is not set");
    }

    const client = axios.create({
        baseURL: `${baseURL}/api`,
        timeout: TIMEOUT_MS,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${apiKey}`,
        },
    });

    return client;
}

/**
 * Extracts error message from axios error or unknown error.
 */
export function getErrorMessage(error: unknown): string {
    if (error instanceof AxiosError) {
        const data = error.response?.data;
        if (typeof data === "string") return data;
        if (typeof data === "object" && data?.message) return data.message;
        return error.message;
    }
    if (error instanceof Error) return error.message;
    return String(error);
}
