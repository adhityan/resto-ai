import { Logger } from "@nestjs/common";
import { BaseError } from "@repo/utils";

export class CustomerNotFoundError extends BaseError {
    private readonly logger = new Logger(CustomerNotFoundError.name);
    public readonly error = "Customer not found";

    constructor(data: unknown) {
        super();

        this.logger.debug("CustomerNotFoundError", { data });
    }
}
