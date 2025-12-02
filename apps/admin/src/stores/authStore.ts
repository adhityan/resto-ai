import { ACCESS_TOKEN_STORAGE_KEY } from "@/config/constants";
import type { AuthUser } from "@/types/auth";
import { create } from "zustand";

interface AuthState {
    auth: {
        user: AuthUser | null;
        setUser: (user: AuthUser | null) => void;
        accessToken: string;
        setAccessToken: (accessToken: string) => void;
        resetAccessToken: () => void;
        reset: () => void;
    };
}

export const useAuthStore = create<AuthState>()((set) => {
    const storedToken = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
    const initToken = storedToken || "";
    return {
        auth: {
            user: null,
            setUser: (user) => set((state) => ({ ...state, auth: { ...state.auth, user } })),
            accessToken: initToken,
            setAccessToken: (accessToken) =>
                set((state) => {
                    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken);
                    return { ...state, auth: { ...state.auth, accessToken } };
                }),
            resetAccessToken: () =>
                set((state) => {
                    localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
                    return {
                        ...state,
                        auth: { ...state.auth, accessToken: "" },
                    };
                }),
            reset: () =>
                set((state) => {
                    localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
                    return {
                        ...state,
                        auth: { ...state.auth, user: null, accessToken: "" },
                    };
                }),
        },
    };
});
