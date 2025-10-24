import {
    Body,
    Controller,
    Get,
    Inject,
    Param,
    Patch,
    Post,
} from "@nestjs/common";
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import {
    RestaurantModel,
    CreateRestaurantModel,
    UpdateRestaurantModel,
} from "@repo/contracts";

import { RestaurantService } from "./restaurant.service";
import { OnlyAdmin } from "../../decorators/user-api.decorator";
import { RestaurantNotFoundError } from "../../errors/restaurant-not-found.error";

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
        const restaurant = await this.restaurantService.findRestaurantById(id);
        if (!restaurant) throw new RestaurantNotFoundError(id);
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
            body.basePath,
            body.zenchefId,
            body.apiToken
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
}
