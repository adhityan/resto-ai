import { Controller, Inject, Param, Post } from "@nestjs/common";
import { ApiCreatedResponse, ApiTags } from "@nestjs/swagger";
import { LivekitTokenResponseModel } from "@repo/contracts";

import { LivekitService } from "./livekit.service";
import { OnlyAdmin } from "../../decorators/user-api.decorator";

@ApiTags("livekit")
@Controller("livekit")
export class LivekitController {
    @Inject()
    private readonly livekitService: LivekitService;

    @OnlyAdmin()
    @Post("token/:restaurantId")
    @ApiCreatedResponse({
        type: LivekitTokenResponseModel,
        description: "Returns a LiveKit token for connecting to a test room",
    })
    public async generateToken(
        @Param("restaurantId") restaurantId: string
    ): Promise<LivekitTokenResponseModel> {
        const result = await this.livekitService.generateToken(restaurantId);
        return new LivekitTokenResponseModel(result);
    }
}

