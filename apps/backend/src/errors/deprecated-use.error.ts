import { BaseError } from '@repo/utils';

export class DeprecatedUsageError extends BaseError {
    public readonly message = 'This method is not supported any more';
}
