import { Inject, Injectable, Logger } from "@nestjs/common";
import { DatabaseService, Customer, Call, Reservation } from "@repo/database";
import { RestaurantService } from "../restaurant/restaurant.service";
import { GeneralError } from "src/errors";
import { CustomerNotFoundError } from "../../errors";

@Injectable()
export class CustomerService {
    private readonly logger = new Logger(CustomerService.name);

    @Inject()
    private readonly databaseService: DatabaseService;

    @Inject()
    private readonly restaurantService: RestaurantService;

    public async upsertCustomer(
        restaurantId: string,
        data: {
            phone: string;
            name?: string;
            email?: string;
            address?: string;
            isOnCall?: boolean;
        }
    ): Promise<Customer> {
        this.logger.log(`Upserting customer with phone: ${data.phone}`);

        const restaurant =
            await this.restaurantService.findRestaurantById(restaurantId);
        if (!restaurant)
            throw new GeneralError(
                `Restaurant with id ${restaurantId} not found`
            );

        const { isOnCall, ...customerData } = data;

        return this.databaseService.customer.upsert({
            where: {
                restaurantId_phone: { restaurantId, phone: data.phone },
            },
            create: {
                restaurantId,
                ...customerData,
                numberOfCalls: isOnCall ? 1 : 0,
            },
            update: {
                ...customerData,
                ...(isOnCall && { numberOfCalls: { increment: 1 } }),
            },
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

    public async getCustomers(filters: {
        restaurantId?: string;
        skip?: number;
        take?: number;
    }): Promise<{
        items: (Customer & { restaurant: { name: string } })[];
        total: number;
    }> {
        this.logger.log(
            `Fetching customers with filters: ${JSON.stringify(filters)}`
        );

        const where: { restaurantId?: string } = {};

        if (filters.restaurantId) {
            where.restaurantId = filters.restaurantId;
        }

        const skip = filters.skip ?? 0;
        const take = filters.take ?? 10;

        const [customers, total] = await Promise.all([
            this.databaseService.customer.findMany({
                where,
                include: {
                    restaurant: {
                        select: { name: true },
                    },
                },
                skip,
                take,
                orderBy: {
                    createdAt: "desc",
                },
            }),
            this.databaseService.customer.count({ where }),
        ]);

        return { items: customers, total };
    }

    public async getCustomersByRestaurantId(
        restaurantId: string
    ): Promise<Customer[]> {
        this.logger.log(`Fetching customers for restaurant: ${restaurantId}`);
        return this.databaseService.customer.findMany({
            where: { restaurantId },
        });
    }

    public async getCustomerCalls(
        customerId: string
    ): Promise<{
        items: (Call & { restaurant: { name: string } })[];
        total: number;
    }> {
        this.logger.log(`Fetching calls for customer: ${customerId}`);

        const customer = await this.findCustomerById(customerId);
        if (!customer) {
            throw new CustomerNotFoundError(customerId);
        }

        const [calls, total] = await Promise.all([
            this.databaseService.call.findMany({
                where: { customerId },
                include: {
                    restaurant: {
                        select: { name: true },
                    },
                },
                orderBy: { startTime: "desc" },
            }),
            this.databaseService.call.count({ where: { customerId } }),
        ]);

        return { items: calls, total };
    }

    public async getCustomerReservations(
        customerId: string
    ): Promise<{
        items: (Reservation & { restaurant: { id: string; name: string } })[];
        total: number;
    }> {
        this.logger.log(`Fetching reservations for customer: ${customerId}`);

        const customer = await this.findCustomerById(customerId);
        if (!customer) {
            throw new CustomerNotFoundError(customerId);
        }

        // Find reservations by matching customer phone or email
        const where: any = {
            restaurantId: customer.restaurantId,
            OR: [] as any[],
        };

        if (customer.phone) {
            where.OR.push({ customerPhone: customer.phone });
        }
        if (customer.email) {
            where.OR.push({ customerEmail: customer.email });
        }

        // If no phone or email, return empty
        if (where.OR.length === 0) {
            return { items: [], total: 0 };
        }

        const [reservations, total] = await Promise.all([
            this.databaseService.reservation.findMany({
                where,
                include: {
                    restaurant: {
                        select: { id: true, name: true },
                    },
                },
                orderBy: [{ date: "desc" }, { time: "desc" }],
            }),
            this.databaseService.reservation.count({ where }),
        ]);

        return { items: reservations, total };
    }
}
