// Map of phone numbers to restaurant API keys
const phoneToRestaurantMapping: Record<
    string,
    { apiKey: string; restaurantId: string }
> = {
    "+33753549003": {
        apiKey: "YWRoaXR5YW46ZnpMcThUTjRpcHNISnN2",
        restaurantId: "353816f8-4204-406c-842f-529347706874",
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
