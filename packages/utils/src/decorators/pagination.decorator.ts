import { applyDecorators } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';

export function PaginationParams(params?: { defaultLimit?: number }) {
    return applyDecorators(
        ApiQuery({
            name: 'skip',
            required: false,
            allowEmptyValue: false,
            description:
                'The number of items to skip. Default value is 1, which gets you the first page',
        }),
        ApiQuery({
            name: 'take',
            required: false,
            allowEmptyValue: false,
            description: `The number of items to get. The default value is ${params?.defaultLimit || 10}`,
        })
    );
}
