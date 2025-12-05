// Map of phone numbers to restaurant configuration
const phoneToRestaurantMapping: Record<
    string,
    { apiKey: string; restaurantId: string; restaurantManagerPhone: string }
> = {
    "+33753549003": {
        apiKey: "YWRoaXR5YW46ZnpMcThUTjRpcHNISnN2",
        restaurantId: "353816f8-4204-406c-842f-529347706874",
        restaurantManagerPhone: "+31202339587", // Miri Mary manager
    },
};

/**
 * Get restaurant API key by phone number
 * @param phoneNumber - The phone number to look up
 * @returns The restaurant API key or undefined if not found
 */
export function getRestaurantByPhone(phoneNumber: string | null) {
    if (!phoneNumber) return undefined;
    return phoneToRestaurantMapping[phoneNumber];
}
