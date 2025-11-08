import { Inject, Injectable, Logger } from "@nestjs/common";
import { DatabaseService, Restaurant } from "@repo/database";
import { ZenchefService } from "../zenchef/zenchef.service";
import { RestaurantNotFoundError } from "../../errors/restaurant-not-found.error";

@Injectable()
export class RestaurantService {
    private readonly logger = new Logger(RestaurantService.name);

    @Inject()
    private readonly databaseService: DatabaseService;

    @Inject()
    private readonly zenchefService: ZenchefService;

    public async createRestaurant(
        name: string,
        incomingPhoneNumber: string,
        zenchefId: string,
        apiToken: string
    ): Promise<Restaurant> {
        this.logger.log(`Creating restaurant: ${name}`);

        // Fetch seating areas from Zenchef before creating restaurant
        const seatingAreas = await this.zenchefService.getSeatingAreas(
            zenchefId,
            apiToken
        );

        // Create restaurant and seating areas in a transaction
        const restaurant = await this.databaseService.$transaction(
            async (tx) => {
                const newRestaurant = await tx.restaurant.create({
                    data: {
                        name,
                        incomingPhoneNumber,
                        isActive: true,
                        zenchefId,
                        apiToken,
                    },
                });

                await tx.seatingArea.createMany({
                    data: seatingAreas.map((area) => ({
                        name: area.name,
                        description: area.description,
                        maxCapacity: area.max_capacity,
                        restaurantId: newRestaurant.id,
                        zenchefRoomId: area.id,
                    })),
                });

                return newRestaurant;
            }
        );

        this.logger.log(
            `Created restaurant and ${seatingAreas.length} seating areas for: ${name}`
        );

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

    public async getSeatingAreasByRestaurantId(restaurantId: string) {
        return this.databaseService.seatingArea.findMany({
            where: { restaurantId },
        });
    }

    public async syncSeatingAreas(restaurantId: string): Promise<void> {
        this.logger.log(
            `Syncing seating areas for restaurant: ${restaurantId}`
        );

        const restaurant = await this.databaseService.restaurant.findUnique({
            where: { id: restaurantId },
        });

        if (!restaurant) {
            throw new RestaurantNotFoundError(restaurantId);
        }

        // Fetch current seating areas from Zenchef
        const zenchefSeatingAreas = await this.zenchefService.getSeatingAreas(
            restaurant.zenchefId,
            restaurant.apiToken
        );

        // Get existing seating areas from database
        const existingSeatingAreas =
            await this.databaseService.seatingArea.findMany({
                where: { restaurantId },
            });

        // Create a map of Zenchef seating areas by name for easier lookup
        const zenchefAreasMap = new Map(
            zenchefSeatingAreas.map((area) => [area.name, area])
        );

        // Find seating areas to delete (exist in DB but not in Zenchef)
        const areasToDelete = existingSeatingAreas.filter(
            (existingArea) => !zenchefAreasMap.has(existingArea.name)
        );

        // Find seating areas to add (exist in Zenchef but not in DB)
        const existingNamesSet = new Set(
            existingSeatingAreas.map((area) => area.name)
        );
        const areasToAdd = zenchefSeatingAreas.filter(
            (zenchefArea) => !existingNamesSet.has(zenchefArea.name)
        );

        // Delete removed seating areas
        if (areasToDelete.length > 0) {
            await this.databaseService.seatingArea.deleteMany({
                where: {
                    id: {
                        in: areasToDelete.map((area) => area.id),
                    },
                },
            });
            this.logger.log(
                `Deleted ${areasToDelete.length} seating areas for restaurant: ${restaurantId}`
            );
        }

        // Add new seating areas
        if (areasToAdd.length > 0) {
            await this.databaseService.seatingArea.createMany({
                data: areasToAdd.map((area) => ({
                    name: area.name,
                    description: area.description,
                    maxCapacity: area.max_capacity,
                    zenchefRoomId: area.id,
                    restaurantId,
                })),
            });
            this.logger.log(
                `Added ${areasToAdd.length} seating areas for restaurant: ${restaurantId}`
            );
        }

        this.logger.log(
            `Seating areas sync completed for restaurant: ${restaurantId}`
        );
    }
}
