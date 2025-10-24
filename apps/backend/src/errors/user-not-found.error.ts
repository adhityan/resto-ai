import { Logger } from '@nestjs/common';
import { BaseError } from '@repo/utils';

export class UserNotFoundError extends BaseError {
    private readonly logger = new Logger(UserNotFoundError.name);
    public readonly error = 'Username or password is incorrect';

    constructor(data: unknown) {
        super();

        this.logger.debug('UserNotFoundError', { data });
    }
}
