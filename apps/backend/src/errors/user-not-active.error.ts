import { Logger } from '@nestjs/common';
import { BaseError } from '@repo/utils';

export class UserNotActiveError extends BaseError {
    private readonly logger = new Logger(UserNotActiveError.name);
    public readonly error = 'Your account has been deactivated';

    constructor(data: unknown) {
        super();

        this.logger.debug('UserNotActiveError', { data });
    }
}
