import { ApiProperty } from "@nestjs/swagger";
import { CustomerListItemModel } from "./customer-list-item.model";

export class CustomerListResponseModel {
    @ApiProperty({ type: [CustomerListItemModel] })
    items: CustomerListItemModel[];

    @ApiProperty()
    total: number;

    constructor(items: CustomerListItemModel[], total: number) {
        this.items = items;
        this.total = total;
    }
}
