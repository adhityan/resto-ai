import { Logger } from "@nestjs/common";
import { BaseError } from "@repo/utils";

export class UnsupportedCheckoutError extends BaseError {
    private readonly logger = new Logger(UnsupportedCheckoutError.name);
    public readonly error: string;

    constructor(message: string) {
        super();
        this.error = message;
        this.logger.debug("UnsupportedCheckoutError", { message });
    }
}
