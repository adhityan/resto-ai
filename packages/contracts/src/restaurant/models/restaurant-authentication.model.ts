import { ApiProperty } from "@nestjs/swagger";
import { RestaurantAuthentication } from "@repo/database";

/**
 * Model for listing restaurant authentications.
 * Note: clientSecret is NEVER exposed after creation.
 */
export class RestaurantAuthenticationModel {
    @ApiProperty()
    id: string;

    @ApiProperty()
    clientId: string;

    @ApiProperty()
    isActive: boolean;

    @ApiProperty()
    createdAt: Date;

    constructor(auth: RestaurantAuthentication) {
        this.id = auth.id;
        this.clientId = auth.clientId;
        this.isActive = auth.isActive;
        this.createdAt = auth.createdAt;
    }
}

/**
 * Response model for creating a new authentication.
 * This is the ONLY time the clientSecret is returned.
 */
export class CreateRestaurantAuthenticationResponseModel {
    @ApiProperty()
    id: string;

    @ApiProperty()
    clientId: string;

    @ApiProperty({ description: "The client secret. This will only be shown once." })
    clientSecret: string;

    constructor(data: { id: string; clientId: string; clientSecret: string }) {
        this.id = data.id;
        this.clientId = data.clientId;
        this.clientSecret = data.clientSecret;
    }
}

