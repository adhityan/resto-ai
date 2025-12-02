export const API = {
    // Stats/Dashboard
    DASHBOARD: "/stats/dashboard",
    REVENUE_OVERVIEW: "/stats/revenue-overview",
    CUSTOMER_TREND: "/stats/customer-trend",
    REVENUE_APP_BREAKDOWN: "/stats/revenue-app-breakdown",

    // Payments
    PAYMENTS: "/payments",
    PAYMENT_DETAIL: (id: string) => `/payments/${id}`,

    // Apps
    APPS: "/apps",
    APP_DETAIL: (id: string) => `/apps/${id}`,
    APP_AUTHENTICATIONS: (id: string) => `/apps/${id}/authentications`,
    DELETE_APP_AUTHENTICATION: (appId: string, authId: string) => `/apps/${appId}/authentications/${authId}`,

    // Products
    PRODUCTS: "/products",
    PRODUCT_DETAIL: (id: string) => `/products/${id}`,

    // Customers
    CUSTOMERS: "/customers",
    CUSTOMER_DETAIL: (id: string) => `/customers/${id}`,

    // Admins
    ADMINS: "/users",

    // Auth
    LOGIN: "/auth/user/login",
    REGISTER: "/auth/user/register",
    ME: "/auth/user",
    CREATE_APP_AUTHENTICATION: "/auth/app/authentication",

    // Session
    SESSION_TRACK: (sessionId: string) => `/session/track?session=${sessionId}`,

    // Currency
    SUPPORTED_CURRENCIES: "/currency/supported",
} as const;
