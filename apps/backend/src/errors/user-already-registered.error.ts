import { Logger } from '@nestjs/common';
import { BaseError } from '@repo/utils';

export class UserAlreadyRegisteredError extends BaseError {
    private readonly logger = new Logger(UserAlreadyRegisteredError.name);

    userEmail: string;
    public readonly error = 'user already registered';

    constructor(userEmail: string) {
        super();
        this.userEmail = userEmail;
        this.logger.debug('UserAlreadyRegisteredError', userEmail);
    }
}
