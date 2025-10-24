import { Inject, Injectable, Logger } from "@nestjs/common";
import { DatabaseService, Customer } from "@repo/database";
import { RestaurantService } from "../restaurant/restaurant.service";
import { GeneralError } from "src/errors";

@Injectable()
export class CustomerService {
    private readonly logger = new Logger(CustomerService.name);

    @Inject()
    private readonly databaseService: DatabaseService;

    @Inject()
    private readonly restaurantService: RestaurantService;

    public async createCustomer(
        restaurantId: string,
        name: string,
        email: string,
        phone: string | undefined
    ): Promise<Customer> {
        this.logger.log(`Creating customer: ${name}, ${email}`);

        const restaurant =
            await this.restaurantService.findRestaurantById(restaurantId);
        if (!restaurant)
            throw new GeneralError(
                `Restaurant with id ${restaurantId} not found`
            );

        const customer = await this.databaseService.customer.create({
            data: {
                restaurantId,
                name,
                email,
                phone,
            },
        });

        return customer;
    }

    public async updateCustomer(
        restaurantId: string,
        id: string,
        data: {
            name?: string;
            email?: string;
            phone?: string;
        }
    ): Promise<Customer> {
        const customer = await this.findCustomerById(id);
        if (!customer)
            throw new GeneralError(`Customer with id ${id} not found`);

        if (customer.restaurantId !== restaurantId)
            throw new GeneralError(
                `Customer with id ${id} does not belong to restaurant with id ${restaurantId}`
            );

        this.logger.log(`Updating customer: ${id}`);
        return this.databaseService.customer.update({
            where: { id },
            data,
        });
    }

    public async findCustomerById(id: string): Promise<Customer | null> {
        this.logger.log(`Finding customer by id: ${id}`);
        return this.databaseService.customer.findUnique({
            where: { id },
        });
    }

    public async findCustomerByPhone(
        restaurantId: string,
        phone: string
    ): Promise<Customer | null> {
        this.logger.log(`Finding customer by phone: ${phone}`);
        return this.databaseService.customer.findUnique({
            where: { restaurantId_phone: { restaurantId, phone } },
        });
    }

    public async findCustomerByEmail(
        restaurantId: string,
        email: string
    ): Promise<Customer | null> {
        this.logger.log(`Finding customer by email: ${email}`);
        return this.databaseService.customer.findUnique({
            where: { restaurantId_email: { restaurantId, email } },
        });
    }

    public async getCustomers(filters?: {
        restaurants?: string[];
        skip?: number;
        take?: number;
    }): Promise<Customer[]> {
        this.logger.log(
            `Fetching customers with filters: ${JSON.stringify(filters)}`
        );

        const where: any = {};

        // Restaurant filter
        if (filters?.restaurants && filters.restaurants.length > 0) {
            where.restaurantId = {
                in: filters.restaurants,
            };
        }

        const skip = filters?.skip || 0;
        const take = filters?.take || 10;

        return this.databaseService.customer.findMany({
            where,
            skip,
            take,
            orderBy: {
                createdAt: "desc",
            },
        });
    }

    public async getCustomersByRestaurantId(
        restaurantId: string
    ): Promise<Customer[]> {
        this.logger.log(`Fetching customers for restaurant: ${restaurantId}`);
        return this.databaseService.customer.findMany({
            where: { restaurantId },
        });
    }
}
