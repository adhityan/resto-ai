import {
    Body,
    Controller,
    Delete,
    Get,
    Inject,
    Param,
    Patch,
    Post,
    Req,
    UnauthorizedException,
} from "@nestjs/common";
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import {
    RestaurantModel,
    CreateRestaurantModel,
    UpdateRestaurantModel,
    RestaurantAuthenticationModel,
    CreateRestaurantAuthenticationResponseModel,
} from "@repo/contracts";

import { RestaurantService } from "./restaurant.service";
import { OnlyAdmin, OnlyApp } from "../../decorators/user-api.decorator";
import { RestaurantNotFoundError } from "../../errors/restaurant-not-found.error";
import { AuthenticatedRequest } from "src/types/request";

@ApiTags("restaurants")
@Controller("restaurants")
export class RestaurantController {
    @Inject()
    private readonly restaurantService: RestaurantService;

    @OnlyAdmin()
    @Get()
    @ApiOkResponse({
        type: [RestaurantModel],
    })
    public async getRestaurants(): Promise<RestaurantModel[]> {
        const restaurants = await this.restaurantService.getRestaurants();
        return restaurants.map((restaurant) => new RestaurantModel(restaurant));
    }

    @OnlyAdmin()
    @Get(":id")
    @ApiOkResponse({
        type: RestaurantModel,
    })
    public async getRestaurantById(
        @Param("id") id: string
    ): Promise<RestaurantModel> {
        const result =
            await this.restaurantService.findRestaurantByIdWithSeatingAreas(id);
        if (!result) throw new RestaurantNotFoundError(id);
        return new RestaurantModel(result.restaurant, result.seatingAreas);
    }

    @OnlyApp()
    @Get("me")
    @ApiOkResponse({
        type: RestaurantModel,
    })
    public async getMyRestaurant(
        @Req() req: AuthenticatedRequest
    ): Promise<RestaurantModel> {
        const restaurantId = req.loginPayload.restaurantId;
        if (!restaurantId) throw new UnauthorizedException();

        const restaurant =
            await this.restaurantService.findRestaurantById(restaurantId);
        if (!restaurant) throw new RestaurantNotFoundError(restaurantId);
        return new RestaurantModel(restaurant);
    }

    @OnlyAdmin()
    @Post()
    @ApiCreatedResponse({
        type: RestaurantModel,
    })
    public async createRestaurant(
        @Body() body: CreateRestaurantModel
    ): Promise<RestaurantModel> {
        const restaurant = await this.restaurantService.createRestaurant(
            body.name,
            body.incomingPhoneNumber,
            body.zenchefId,
            body.apiToken,
            body.website,
            body.information
        );
        return new RestaurantModel(restaurant);
    }

    @OnlyAdmin()
    @Patch(":id")
    @ApiOkResponse({
        type: RestaurantModel,
    })
    public async updateRestaurant(
        @Param("id") id: string,
        @Body() body: UpdateRestaurantModel
    ): Promise<RestaurantModel> {
        const restaurant = await this.restaurantService.updateRestaurant(
            id,
            body
        );
        return new RestaurantModel(restaurant);
    }

    @OnlyAdmin()
    @Post(":id/sync-seating-areas")
    @ApiOkResponse({
        description: "Seating areas synced successfully",
    })
    public async syncSeatingAreas(
        @Param("id") id: string
    ): Promise<{ message: string }> {
        await this.restaurantService.syncSeatingAreas(id);
        return { message: "Seating areas synced successfully" };
    }

    @OnlyAdmin()
    @Get(":id/authentications")
    @ApiOkResponse({
        type: [RestaurantAuthenticationModel],
    })
    public async getAuthentications(
        @Param("id") id: string
    ): Promise<RestaurantAuthenticationModel[]> {
        const auths = await this.restaurantService.getAuthentications(id);
        return auths.map((auth) => new RestaurantAuthenticationModel(auth));
    }

    @OnlyAdmin()
    @Post(":id/authentications")
    @ApiCreatedResponse({
        type: CreateRestaurantAuthenticationResponseModel,
        description:
            "Returns the client credentials. The secret is only shown once.",
    })
    public async createAuthentication(
        @Param("id") id: string
    ): Promise<CreateRestaurantAuthenticationResponseModel> {
        const result = await this.restaurantService.createAuthentication(id);
        return new CreateRestaurantAuthenticationResponseModel(result);
    }

    @OnlyAdmin()
    @Delete(":id/authentications/:authId")
    @ApiOkResponse({
        description: "Authentication deleted successfully",
    })
    public async deleteAuthentication(
        @Param("id") id: string,
        @Param("authId") authId: string
    ): Promise<{ message: string }> {
        await this.restaurantService.deleteAuthentication(id, authId);
        return { message: "Authentication deleted successfully" };
    }
}
