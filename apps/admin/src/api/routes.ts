export const API = {
    // Stats/Dashboard
    DASHBOARD: "/stats/dashboard",
    OPERATIONS_OVERVIEW: "/stats/operations-overview",
    CALL_DURATION_TREND: "/stats/call-duration-trend",
    LANGUAGE_BREAKDOWN: "/stats/language-breakdown",

    // Calls
    CALLS: "/calls",
    CALL_DETAIL: (id: string) => `/calls/${id}`,
    CALL_TRANSCRIPTS: (id: string) => `/calls/${id}/transcripts`,
    ACTIVE_CALLS_COUNT: "/calls/active-count",

    // Reservations (from local database via admin API)
    RESERVATIONS: "/reservations/admin/list",
    RESERVATION_DETAIL: (id: string) => `/reservations/admin/${id}`,

    // Restaurants
    RESTAURANTS: "/restaurants",
    RESTAURANT_DETAIL: (id: string) => `/restaurants/${id}`,
    RESTAURANT_AUTHENTICATIONS: (id: string) => `/restaurants/${id}/authentications`,
    DELETE_RESTAURANT_AUTHENTICATION: (restaurantId: string, authId: string) =>
        `/restaurants/${restaurantId}/authentications/${authId}`,

    // LiveKit
    LIVEKIT_TOKEN: (restaurantId: string) => `/livekit/token/${restaurantId}`,

    // Customers
    CUSTOMERS: "/customers",
    CUSTOMER_DETAIL: (id: string) => `/customers/${id}`,

    // Admins
    ADMINS: "/users",

    // Auth
    LOGIN: "/auth/user/login",
    REGISTER: "/auth/user/register",
    ME: "/auth/user",
} as const;
