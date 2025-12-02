import { create } from "zustand";

export interface CustomerListItem {
    id: string;
    name: string;
    email: string;
    address?: string;
    remoteCustomerId: string;
    stripeCustomerId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface CustomerDetail {
    id: string;
    name: string;
    email: string;
    address?: string;
    remoteCustomerId: string;
    stripeCustomerId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface CustomerListFilters {
    applications: string[];
    products: string[];
    skip: number;
    take: number;
}

interface CustomersState {
    customers: CustomerListItem[];
    total: number;
    filters: CustomerListFilters;
    setFilters: (filters: Partial<CustomerListFilters>) => void;
    resetFilters: () => void;
    setCustomers: (customers: CustomerListItem[], total: number) => void;
    selectedCustomer: CustomerDetail | null;
    setSelectedCustomer: (customer: CustomerDetail | null) => void;
    setFilterValue: (type: keyof CustomerListFilters, values: string[] | number) => void;
    setPagination: (pagination: { skip: number; take: number }) => void;
}

const defaultFilters: CustomerListFilters = {
    applications: [],
    products: [],
    skip: 0,
    take: 10,
};

export const useCustomersStore = create<CustomersState>()((set) => ({
    customers: [],
    total: 0,
    filters: defaultFilters,
    setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
    resetFilters: () => set({ filters: defaultFilters }),
    setCustomers: (customers, total) => set(() => ({ customers, total })),
    selectedCustomer: null,
    setSelectedCustomer: (customer) => set(() => ({ selectedCustomer: customer })),
    setFilterValue: (type, values) => set((state) => ({ filters: { ...state.filters, [type]: values } })),
    setPagination: (pagination) =>
        set((state) => ({
            filters: { ...state.filters, ...pagination },
        })),
}));
