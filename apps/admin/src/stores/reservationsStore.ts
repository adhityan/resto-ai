import { create } from "zustand";

export interface ReservationListItem {
    id: string;
    zenchefBookingId: string;
    status: string;
    date: string;
    time: string;
    numberOfGuests: number;
    customerName: string;
    customerPhone: string | undefined;
    customerEmail: string | undefined;
    comments: string | undefined;
    allergies: string | undefined;
    seatingAreaName: string | undefined;
    restaurantId: string;
    restaurantName: string | undefined;
}

export interface ReservationDetail {
    id: string;
    zenchefBookingId: string;
    status: string;
    date: string;
    time: string;
    numberOfGuests: number;
    customerName: string;
    customerPhone: string | undefined;
    customerEmail: string | undefined;
    comments: string | undefined;
    allergies: string | undefined;
    seatingAreaName: string | undefined;
    restaurantId: string;
    restaurantName: string | undefined;
    createdAt: Date;
    updatedAt: Date;
}

export interface ReservationListFilters {
    restaurantId: string | undefined;
    date: string | undefined;
    status: string[];
    skip: number;
    take: number;
}

interface ReservationsState {
    reservations: ReservationListItem[];
    total: number;
    filters: ReservationListFilters;
    setFilters: (filters: Partial<ReservationListFilters>) => void;
    resetFilters: () => void;
    setReservations: (reservations: ReservationListItem[], total: number) => void;
    selectedReservation: ReservationDetail | null;
    setSelectedReservation: (reservation: ReservationDetail | null) => void;
    setFilterValue: (
        type: keyof ReservationListFilters,
        values: string[] | string | number | undefined
    ) => void;
    setPagination: (pagination: { skip: number; take: number }) => void;
}

const defaultFilters: ReservationListFilters = {
    restaurantId: undefined,
    date: undefined,
    status: [],
    skip: 0,
    take: 10,
};

export const useReservationsStore = create<ReservationsState>()((set) => ({
    reservations: [],
    total: 0,
    filters: defaultFilters,
    setFilters: (filters) =>
        set((state) => ({ filters: { ...state.filters, ...filters } })),
    resetFilters: () => set({ filters: defaultFilters }),
    setReservations: (reservations, total) => set(() => ({ reservations, total })),
    selectedReservation: null,
    setSelectedReservation: (reservation) =>
        set(() => ({ selectedReservation: reservation })),
    setFilterValue: (type, values) =>
        set((state) => ({ filters: { ...state.filters, [type]: values } })),
    setPagination: (pagination) =>
        set((state) => ({
            filters: { ...state.filters, ...pagination },
        })),
}));
