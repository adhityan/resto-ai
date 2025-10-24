import { Logger } from "@nestjs/common";
import { BaseError } from "@repo/utils";

export class MixedProductTypesError extends BaseError {
    private readonly logger = new Logger(MixedProductTypesError.name);
    public readonly error: string;

    constructor() {
        super();
        this.error = "Cannot have both one-time and recurring products in the same checkout";
        this.logger.debug("MixedProductTypesError", { message: this.error });
    }
}
