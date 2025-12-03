import { Logger } from "@nestjs/common";
import { BaseError } from "@repo/utils";

export class CallNotFoundError extends BaseError {
    private readonly logger = new Logger(CallNotFoundError.name);
    public readonly error = "Call not found";

    constructor(data: unknown) {
        super();

        this.logger.debug("CallNotFoundException", { data });
    }
}

