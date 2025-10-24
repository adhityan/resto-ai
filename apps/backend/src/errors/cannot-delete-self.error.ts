import { Logger } from "@nestjs/common";
import { BaseError } from "@repo/utils";

export class CannotDeleteSelfError extends BaseError {
    private readonly logger = new Logger(CannotDeleteSelfError.name);
    public readonly error = "You cannot delete your own account";

    constructor(data: unknown) {
        super();

        this.logger.debug("CannotDeleteSelfError", { data });
    }
}
