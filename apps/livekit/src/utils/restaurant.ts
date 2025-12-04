// Map of phone numbers to restaurant API keys
const phoneToRestaurantKey: Record<string, string> = {
    "+33753549003": "YWRoaXR5YW46ZnpMcThUTjRpcHNISnN2",
};

/**
 * Get restaurant API key by phone number
 * @param phoneNumber - The phone number to look up
 * @returns The restaurant API key or undefined if not found
 */
export function getRestaurantKeyByPhone(
    phoneNumber: string | null
): string | undefined {
    if (!phoneNumber) return undefined;
    return phoneToRestaurantKey[phoneNumber];
}
