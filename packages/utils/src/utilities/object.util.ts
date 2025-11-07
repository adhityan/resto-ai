import * as util from "util";

export class ObjectUtils {
    public static toString(object: any) {
        return util.inspect(object, {
            compact: true,
            showHidden: false,
            depth: null,
            colors: true,
        });
    }

    /**
     * Sanitizes an identifier by removing sensitive fields like passwords
     * @param identifier The identifier to sanitize
     * @param sensitiveFields Array of field names to remove (defaults to ['password'])
     * @returns Sanitized identifier
     */
    public static sanitizeIdentifier(
        identifier: unknown,
        sensitiveFields: string[] = ["password"]
    ): unknown {
        if (typeof identifier === "object" && identifier !== null) {
            const sanitized = { ...identifier } as any;

            // Remove sensitive fields
            for (const field of sensitiveFields) {
                if (field in sanitized) {
                    delete sanitized[field];
                }
            }

            return sanitized;
        }
        return identifier;
    }
}
