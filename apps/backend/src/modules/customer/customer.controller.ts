import {
    Body,
    Controller,
    Get,
    Inject,
    Param,
    Post,
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
    CustomerListItemModel,
    CustomerListResponseModel,
    UpsertCustomerModel,
} from "@repo/contracts";

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
    @ApiOkResponse({ type: CustomerListResponseModel })
    @ApiQuery({ name: "restaurantId", required: false })
    @ApiQuery({ name: "skip", required: false, type: Number })
    @ApiQuery({ name: "take", required: false, type: Number })
    public async getCustomers(
        @Query("restaurantId") restaurantId?: string,
        @Query("skip") skip?: string,
        @Query("take") take?: string
    ): Promise<CustomerListResponseModel> {
        const { items, total } = await this.customerService.getCustomers({
            restaurantId,
            skip: skip ? Number.parseInt(skip, 10) : undefined,
            take: take ? Number.parseInt(take, 10) : undefined,
        });

        return new CustomerListResponseModel(
            items.map((customer) => new CustomerListItemModel(customer)),
            total
        );
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
    public async createOrUpdateCustomer(
        @Req() req: AuthenticatedRequest,
        @Body() body: UpsertCustomerModel
    ): Promise<CustomerModel> {
        const customer = await this.customerService.upsertCustomer(
            req.loginPayload.userId,
            body
        );
        return new CustomerModel(customer);
    }
}
