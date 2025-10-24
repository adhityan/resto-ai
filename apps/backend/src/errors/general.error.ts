import { Logger } from "@nestjs/common";
import { BaseError } from "@repo/utils";

export class GeneralError extends BaseError {
    private readonly logger = new Logger(GeneralError.name);
    public readonly error: string;

    constructor(message: string) {
        super();
        this.error = message;
        this.logger.debug(`GeneralError: ${message}`);
    }
}
