import { Inject, Injectable, Logger } from "@nestjs/common";
import { DatabaseService, Restaurant } from "@repo/database";

@Injectable()
export class RestaurantService {
    private readonly logger = new Logger(RestaurantService.name);

    @Inject()
    private readonly databaseService: DatabaseService;

    public async createRestaurant(
        name: string,
        incomingPhoneNumber: string,
        zenchefId: string,
        apiToken: string
    ): Promise<Restaurant> {
        this.logger.log(`Creating restaurant: ${name}`);

        const restaurant = await this.databaseService.restaurant.create({
            data: {
                name,
                incomingPhoneNumber,
                isActive: true,
                zenchefId,
                apiToken,
            },
        });

        return restaurant;
    }

    public async updateRestaurant(
        restaurantId: string,
        data: {
            name?: string;
            incomingPhoneNumber?: string;
            isActive?: boolean;
        }
    ): Promise<Restaurant> {
        this.logger.log(`Updating restaurant: ${restaurantId}`);
        return this.databaseService.restaurant.update({
            where: { id: restaurantId },
            data,
        });
    }

    public async findRestaurantById(id: string): Promise<Restaurant | null> {
        this.logger.log(`Finding restaurant by id: ${id}`);
        const restaurant = await this.databaseService.restaurant.findUnique({
            where: { id },
        });

        if (!restaurant) return null;
        return restaurant;
    }

    public async getRestaurants(): Promise<Restaurant[]> {
        this.logger.log("Fetching all restaurants");
        return this.databaseService.restaurant.findMany({});
    }
}
