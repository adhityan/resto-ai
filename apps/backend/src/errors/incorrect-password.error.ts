import { Logger } from "@nestjs/common";
import { BaseError, ObjectUtils } from "@repo/utils";

export class IncorrectPasswordError extends BaseError {
    private readonly logger = new Logger(IncorrectPasswordError.name);
    public readonly identifier: unknown;

    public readonly error: string;

    constructor(identifier: unknown) {
        super();

        // Sanitize identifier to avoid logging sensitive data like passwords
        const sanitized = ObjectUtils.sanitizeIdentifier(identifier);
        this.logger.debug("IncorrectPasswordError", sanitized);
        this.error = "Username or password is incorrect";
        this.identifier = identifier;
    }
}
