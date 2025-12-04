import { create } from "zustand";

export interface Restaurant {
    id: string;
    name: string;
    information: string;
    website: string;
    isActive: boolean;
    restaurantPhoneNumber: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface RestaurantAuthentication {
    id: string;
    clientId: string;
    isActive: boolean;
    createdAt: Date;
}

interface RestaurantsState {
    restaurants: Restaurant[];
    setRestaurants: (restaurants: Restaurant[]) => void;
    selectedRestaurant: Restaurant | null;
    setSelectedRestaurant: (restaurant: Restaurant | null) => void;
}

export const useRestaurantsStore = create<RestaurantsState>()((set) => ({
    restaurants: [],
    setRestaurants: (restaurants) => set(() => ({ restaurants })),
    selectedRestaurant: null,
    setSelectedRestaurant: (restaurant) =>
        set(() => ({ selectedRestaurant: restaurant })),
}));

