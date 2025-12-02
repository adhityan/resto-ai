import { create } from "zustand";

export interface ProductListItem {
    id: string;
    name: string;
    description: string;
    isActive: boolean;
    remoteProductId: string;
    activePrice: {
        id: string;
        price: number;
        currency: string;
        interval: string;
    };
    appName?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ProductDetail {
    id: string;
    name: string;
    description: string;
    isActive: boolean;
    remoteProductId: string;
    activePrice: {
        id: string;
        price: number;
        currency: string;
        interval: string;
    };
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ProductListFilters {
    applications: string[];
    skip: number;
    take: number;
}

interface ProductsState {
    products: ProductListItem[];
    total: number;
    filters: ProductListFilters;
    setFilters: (filters: Partial<ProductListFilters>) => void;
    resetFilters: () => void;
    setProducts: (products: ProductListItem[], total: number) => void;
    addProduct: (product: ProductListItem) => void;
    selectedProduct: ProductDetail | null;
    setSelectedProduct: (product: ProductDetail | null) => void;
    setFilterValue: (type: keyof ProductListFilters, values: string[] | number) => void;
    setPagination: (pagination: { skip: number; take: number }) => void;
}

const defaultFilters: ProductListFilters = {
    applications: [],
    skip: 0,
    take: 10,
};

export const useProductsStore = create<ProductsState>()((set) => ({
    products: [],
    total: 0,
    filters: defaultFilters,
    setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
    resetFilters: () => set({ filters: defaultFilters }),
    setProducts: (products, total) => set(() => ({ products, total })),
    addProduct: (product) => set((state) => ({ products: [product, ...state.products], total: state.total + 1 })),
    selectedProduct: null,
    setSelectedProduct: (product) => set(() => ({ selectedProduct: product })),
    setFilterValue: (type, values) => set((state) => ({ filters: { ...state.filters, [type]: values } })),
    setPagination: (pagination) =>
        set((state) => ({
            filters: { ...state.filters, ...pagination },
        })),
}));
