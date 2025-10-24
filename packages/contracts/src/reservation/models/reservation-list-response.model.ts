import { ApiProperty } from "@nestjs/swagger";
import { ReservationItemModel } from "./reservation-item.model";

/**
 * Response model for reservation list operations (search, getByPhone)
 */
export class ReservationListResponseModel {
    @ApiProperty({
        description: "List of reservations matching the search criteria",
        type: [ReservationItemModel],
    })
    reservations: ReservationItemModel[];

    @ApiProperty({
        description:
            "Human-readable description of the search results for LLM consumption",
        example:
            "Searched for reservations with phone number +33612345678. Found 2 reservations. Details: 2025-10-25 (4 people, Confirmed); 2025-10-28 (2 people, Confirmed).",
    })
    description: string;
}
