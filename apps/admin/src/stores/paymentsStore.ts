import { create } from "zustand";

export interface PaymentListItem {
    id: string;
    productName: string;
    amount: number;
    currency: string;
    customerName: string;
    applicationName: string;
    stripePaymentId: string;
    createdAt: Date;
    updatedAt: Date;
    status: "PENDING" | "COMPLETED" | "DUE";
    type: "one_time" | "subscription";
}

export interface PaymentDetail {
    id: string;
    amount: number;
    currency: string;
    status: "PENDING" | "COMPLETED" | "DUE";
    stripePaymentId: string;
    createdAt: Date;
    updatedAt: Date;
    products:
        | {
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
          }[]
        | null;
    customer: {
        id: string;
        name: string;
        email: string;
    };
    application: {
        id: string;
        name: string;
    };
    subscription: {
        id: string;
        status: string;
        stripeSubscriptionId: string;
    } | null;
    session: {
        id: string;
        status: string;
        stripeSessionId: string;
    } | null;
    type: "one_time" | "subscription";
}

export interface PaymentListFilters {
    status: string[];
    applications: string[];
    products: string[];
    currencies: string[];
    type: "one_time" | "subscription" | "all";
    range: string;
    skip: number;
    take: number;
}

interface PaymentsState {
    payments: PaymentListItem[];
    total: number;
    filters: PaymentListFilters;
    setFilters: (filters: Partial<PaymentListFilters>) => void;
    resetFilters: () => void;
    setPayments: (payments: PaymentListItem[], total: number) => void;
    selectedPayment: PaymentDetail | null;
    setSelectedPayment: (payment: PaymentDetail | null) => void;
    setRange: (range: string) => void;
    setFilterValue: (type: keyof PaymentListFilters, values: string[] | string | number) => void;
    setPagination: (pagination: { skip: number; take: number }) => void;
}

const defaultFilters: PaymentListFilters = {
    status: [],
    applications: [],
    products: [],
    currencies: [],
    type: "all",
    range: "all",
    skip: 0,
    take: 10,
};

export const usePaymentsStore = create<PaymentsState>()((set) => ({
    payments: [],
    total: 0,
    filters: defaultFilters,
    setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
    resetFilters: () => set({ filters: defaultFilters }),
    setPayments: (payments, total) => set(() => ({ payments, total })),
    selectedPayment: null,
    setSelectedPayment: (payment) => set(() => ({ selectedPayment: payment })),
    setRange: (range) => set((state) => ({ filters: { ...state.filters, range } })),
    setFilterValue: (type, values) => set((state) => ({ filters: { ...state.filters, [type]: values } })),
    setPagination: (pagination) =>
        set((state) => ({
            filters: { ...state.filters, ...pagination },
        })),
}));
