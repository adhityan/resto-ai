/**
 * Format an uppercase status string to sentence case for display
 * @param status - Uppercase status string (e.g., "PENDING", "IN_PROGRESS")
 * @returns Sentence case string (e.g., "Pending", "In progress")
 */
export function formatStatus(status: string): string {
    return status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, " ");
}

/**
 * Format payment type to display-friendly text
 * @param type - Payment type ("one_time" or "subscription")
 * @returns Display text ("One Time" or "Subscription")
 */
export function formatPaymentType(type: string): string {
    return type === "one_time" ? "One Time" : "Subscription";
}
