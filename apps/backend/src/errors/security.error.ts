import { Logger } from "@nestjs/common";
import { BaseError } from "@repo/utils";

export class SecurityError extends BaseError {
    private readonly logger = new Logger(SecurityError.name);
    public readonly error: string;

    constructor(message: string) {
        super();

        this.logger.error("SecurityError", { message });
        this.error = message;
    }
}
