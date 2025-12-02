import { create } from "zustand";

export interface App {
    id: string;
    name: string;
    isActive: boolean;
    activeProductsCount?: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface Product {
    id: string;
    name: string;
    description: string;
    isActive: boolean;
    activePrice: ProductPrice;
}

export interface ProductPrice {
    id: string;
    price: number;
    currency: string;
    interval: string;
}

export interface Authentication {
    id: string;
    clientId: string;
    isActive: boolean;
    createdAt: Date;
}

interface AppsState {
    apps: App[];
    setApps: (apps: App[]) => void;
    addApp: (app: App) => void;
    updateApp: (id: string, updates: Partial<App>) => void;
    removeApp: (id: string) => void;
}

export const useAppsStore = create<AppsState>()((set) => ({
    apps: [],
    setApps: (apps) => set(() => ({ apps })),
    addApp: (app) => set((state) => ({ apps: [...state.apps, app] })),
    updateApp: (id, updates) =>
        set((state) => ({
            apps: state.apps.map((app) => (app.id === id ? { ...app, ...updates } : app)),
        })),
    removeApp: (id) => set((state) => ({ apps: state.apps.filter((app) => app.id !== id) })),
}));
