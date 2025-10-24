import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { ReferenceObject, SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

export function ApiFile({
    fieldName = 'file',
    required = false,
    localOptions,
    otherFields,
}: {
    fieldName: string;
    required: boolean;
    localOptions?: MulterOptions;
    otherFields?: Record<string, (SchemaObject | ReferenceObject) & { isRequired?: boolean }>;
}) {
    const requiredParam = required ? [fieldName] : [];
    for (const property in otherFields) {
        if (otherFields[property].isRequired) {
            requiredParam.push(property);
        }
    }

    return applyDecorators(
        UseInterceptors(FileInterceptor(fieldName, localOptions)),
        ApiConsumes('multipart/form-data'),
        ApiBody({
            schema: {
                type: 'object',
                required: requiredParam,
                properties: {
                    [fieldName]: {
                        type: 'string',
                        format: 'binary',
                    },
                    ...otherFields,
                },
            },
        }),
    );
}
