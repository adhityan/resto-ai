import { create } from "zustand";
import { CallStatus } from "@repo/database";

export interface CallListItem {
    id: string;
    status: CallStatus;
    startTime: Date;
    endTime: Date | undefined;
    language: string | undefined;
    escalationRequested: boolean;
    customerId: string | undefined;
    customerName: string | undefined;
    restaurantName: string;
    restaurantId: string;
}

export interface CallDetail {
    id: string;
    status: CallStatus;
    startTime: Date;
    endTime: Date | undefined;
    transcript: string | undefined;
    language: string | undefined;
    escalationRequested: boolean;
    zenchefReservationId: string | undefined;
    customer:
        | {
              id: string;
              name: string | undefined;
              email: string | undefined;
              phone: string | undefined;
          }
        | undefined;
    restaurant: {
        id: string;
        name: string;
        incomingPhoneNumber: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

export interface CallListFilters {
    status: string[];
    restaurantId: string | undefined;
    startDate: string | undefined;
    endDate: string | undefined;
    skip: number;
    take: number;
}

interface CallsState {
    calls: CallListItem[];
    total: number;
    activeCallsCount: number;
    filters: CallListFilters;
    setFilters: (filters: Partial<CallListFilters>) => void;
    resetFilters: () => void;
    setCalls: (calls: CallListItem[], total: number) => void;
    setActiveCallsCount: (count: number) => void;
    selectedCall: CallDetail | null;
    setSelectedCall: (call: CallDetail | null) => void;
    setFilterValue: (
        type: keyof CallListFilters,
        values: string[] | string | number | undefined
    ) => void;
    setPagination: (pagination: { skip: number; take: number }) => void;
}

const defaultFilters: CallListFilters = {
    status: [],
    restaurantId: undefined,
    startDate: undefined,
    endDate: undefined,
    skip: 0,
    take: 10,
};

export const useCallsStore = create<CallsState>()((set) => ({
    calls: [],
    total: 0,
    activeCallsCount: 0,
    filters: defaultFilters,
    setFilters: (filters) =>
        set((state) => ({ filters: { ...state.filters, ...filters } })),
    resetFilters: () => set({ filters: defaultFilters }),
    setCalls: (calls, total) => set(() => ({ calls, total })),
    setActiveCallsCount: (count) => set(() => ({ activeCallsCount: count })),
    selectedCall: null,
    setSelectedCall: (call) => set(() => ({ selectedCall: call })),
    setFilterValue: (type, values) =>
        set((state) => ({ filters: { ...state.filters, [type]: values } })),
    setPagination: (pagination) =>
        set((state) => ({
            filters: { ...state.filters, ...pagination },
        })),
}));
