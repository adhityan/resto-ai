import {
    Body,
    Controller,
    Get,
    Inject,
    Param,
    Post,
    Put,
    Query,
    Req,
} from "@nestjs/common";
import {
    ApiCreatedResponse,
    ApiOkResponse,
    ApiQuery,
    ApiTags,
} from "@nestjs/swagger";
import {
    CustomerModel,
    CreateCustomerModel,
    UpdateCustomerModel,
} from "@repo/contracts";
import { PaginationParams } from "@repo/utils";

import { CustomerService } from "./customer.service";
import {
    isAuthenticated,
    OnlyAdmin,
    OnlyApp,
} from "../../decorators/user-api.decorator";
import { AuthenticatedRequest } from "src/types/request";
import { CustomerNotFoundError } from "../../errors";

@ApiTags("customer")
@Controller("customers")
export class CustomerController {
    @Inject()
    private readonly customerService: CustomerService;

    @OnlyAdmin()
    @Get()
    @PaginationParams({ defaultLimit: 10 })
    @ApiQuery({
        name: "restaurants",
        required: false,
        description: "Comma-separated restaurant IDs",
    })
    @ApiOkResponse({
        type: [CustomerModel],
    })
    public async getCustomers(
        @Query("restaurants") restaurants?: string,
        @Query("skip") skip?: string,
        @Query("take") take?: string
    ): Promise<CustomerModel[]> {
        const filters = {
            restaurants: restaurants ? restaurants.split(",") : undefined,
            skip: skip ? parseInt(skip, 10) : 0,
            take: take ? parseInt(take, 10) : 10,
        };

        const customers = await this.customerService.getCustomers(filters);
        return customers.map((customer) => new CustomerModel(customer));
    }

    @isAuthenticated()
    @Get(":id")
    @ApiOkResponse({
        type: CustomerModel,
    })
    public async getCustomer(
        @Param("id") id: string
    ): Promise<CustomerModel | null> {
        const customer = await this.customerService.findCustomerById(id);
        if (!customer) throw new CustomerNotFoundError(id);
        return new CustomerModel(customer);
    }

    @OnlyApp()
    @Post()
    @ApiCreatedResponse({
        type: CustomerModel,
    })
    public async createCustomer(
        @Req() req: AuthenticatedRequest,
        @Body() body: CreateCustomerModel
    ): Promise<CustomerModel> {
        const customer = await this.customerService.createCustomer(
            req.loginPayload.userId,
            body.name,
            body.email,
            body.phone
        );
        return new CustomerModel(customer);
    }

    @OnlyApp()
    @Put(":id")
    @ApiOkResponse({
        type: CustomerModel,
    })
    public async updateCustomer(
        @Req() req: AuthenticatedRequest,
        @Param("id") id: string,
        @Body() body: UpdateCustomerModel
    ): Promise<CustomerModel> {
        const customer = await this.customerService.updateCustomer(
            req.loginPayload.userId,
            id,
            body
        );
        return new CustomerModel(customer);
    }
}
