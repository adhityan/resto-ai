import { ApiProperty } from "@nestjs/swagger";
import { CallListItemModel } from "./call-list-item.model";

export class CallListResponseModel {
    @ApiProperty({ type: [CallListItemModel] })
    items: CallListItemModel[];

    @ApiProperty()
    total: number;

    constructor(items: CallListItemModel[], total: number) {
        this.items = items;
        this.total = total;
    }
}

