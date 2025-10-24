import { Logger } from "@nestjs/common";
import { BaseError } from "@repo/utils";

export class PaymentNotFoundError extends BaseError {
    private readonly logger = new Logger(PaymentNotFoundError.name);
    public readonly error = "Payment not found";

    constructor(data: unknown) {
        super();

        this.logger.debug("PaymentNotFoundException", { data });
    }
}
