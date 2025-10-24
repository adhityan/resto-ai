import { Logger } from "@nestjs/common";
import { BaseError } from "@repo/utils";

export class RestaurantNotFoundError extends BaseError {
    private readonly logger = new Logger(RestaurantNotFoundError.name);
    public readonly error = "Restaurant not found";

    constructor(data: unknown) {
        super();

        this.logger.debug("RestaurantNotFoundException", { data });
    }
}
