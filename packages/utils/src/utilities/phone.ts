/**
 * Normalizes phone numbers to a standard format for consistent storage and comparison
 * Primarily handles French phone numbers (+33 format)
 *
 * @param phoneNumber - The phone number to normalize (can include spaces, dashes, parentheses)
 * @returns Normalized phone number in +33 format, or original if unable to normalize
 *
 * @example
 * normalizePhoneNumber("0612345678") // "+33612345678"
 * normalizePhoneNumber("+33 6 12 34 56 78") // "+33612345678"
 * normalizePhoneNumber("06-12-34-56-78") // "+33612345678"
 */
export function normalizePhoneNumber(phoneNumber: string): string {
    if (!phoneNumber) {
        return phoneNumber;
    }

    // Remove all spaces, dashes, parentheses, and dots
    let normalized = phoneNumber
        .replace(/[\s\-().]/g, "")
        .trim();

    // Handle French mobile numbers starting with 0
    if (normalized.startsWith("0")) {
        // Replace leading 0 with +33
        normalized = "+33" + normalized.substring(1);
    }
    // Handle numbers that already have +33
    else if (normalized.startsWith("+33")) {
        // Already in correct format, just keep it
        normalized = normalized;
    }
    // Handle numbers starting with 33 (without +)
    else if (normalized.startsWith("33") && normalized.length >= 11) {
        // Add the + prefix
        normalized = "+" + normalized;
    }

    return normalized;
}
