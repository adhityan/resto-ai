import { Logger } from "@nestjs/common";
import { BaseError } from "@repo/utils";

export class SessionNotFoundError extends BaseError {
    private readonly logger = new Logger(SessionNotFoundError.name);
    public readonly error = "Session not found";

    constructor(sessionId: string) {
        super();
        this.logger.debug("SessionNotFoundError", { sessionId });
    }
}

