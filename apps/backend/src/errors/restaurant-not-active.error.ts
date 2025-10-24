import { Logger } from "@nestjs/common";
import { BaseError } from "@repo/utils";

export class RestaurantNotActiveError extends BaseError {
    private readonly logger = new Logger(RestaurantNotActiveError.name);
    public readonly error = "Restaurant is not active";

    constructor(data: unknown) {
        super();

        this.logger.debug("RestaurantNotActiveError", { data });
    }
}
