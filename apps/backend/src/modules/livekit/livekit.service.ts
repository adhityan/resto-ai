import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
    AccessToken,
    RoomAgentDispatch,
    RoomConfiguration,
} from "livekit-server-sdk";
import { randomUUID } from "crypto";

import { RestaurantService } from "../restaurant/restaurant.service";
import { RestaurantNotFoundError } from "../../errors/restaurant-not-found.error";

@Injectable()
export class LivekitService {
    private readonly logger = new Logger(LivekitService.name);

    @Inject()
    private readonly restaurantService: RestaurantService;

    @Inject()
    private readonly configService: ConfigService;

    public async generateToken(
        restaurantId: string,
        participantName?: string
    ): Promise<{ token: string; roomName: string; serverUrl: string }> {
        const restaurant =
            await this.restaurantService.findRestaurantById(restaurantId);
        if (!restaurant) {
            throw new RestaurantNotFoundError(restaurantId);
        }

        const apiKey = this.configService.get<string>("LIVEKIT_API_KEY");
        const apiSecret = this.configService.get<string>("LIVEKIT_API_SECRET");
        const serverUrl =
            this.configService.get<string>("LIVEKIT_URL") ??
            "ws://localhost:7880";

        const roomName = `test-${randomUUID()}`;
        const identity = participantName ?? `admin-${randomUUID().slice(0, 8)}`;

        this.logger.log(
            `Generating token for restaurant ${restaurantId}, room: ${roomName}`
        );

        const at = new AccessToken(apiKey, apiSecret, {
            identity,
        });

        at.addGrant({ roomJoin: true, room: roomName });
        at.roomConfig = new RoomConfiguration({
            agents: [
                new RoomAgentDispatch({
                    agentName: "resto-ai",
                    metadata: JSON.stringify({
                        calledPhoneNumber: restaurant.incomingPhoneNumber,
                        callerPhoneNumber: "+33753546003",
                    }),
                }),
            ],
        });

        const token = await at.toJwt();

        return {
            token,
            roomName,
            serverUrl,
        };
    }
}
