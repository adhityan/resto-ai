import { llm } from "@livekit/agents";
import type { AxiosInstance } from "axios";
import { RestaurantModel } from "@repo/contracts";

export function createGetRestaurantDetailTool(client: AxiosInstance) {
    let cachedData: RestaurantModel;

    return llm.tool({
        description: `Get all the details about the restaurant. This includes the restaurant name, address, general information, phone number and website.`,
        execute: async () => {
            if (cachedData) return cachedData;
            const { data } = await client.get(`/restaurants/me`);
            cachedData = data;
            return data;
        },
    });
}
