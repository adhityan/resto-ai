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

/**
 * Calculate duration in seconds from start and end time
 * @param startTime - Start time
 * @param endTime - End time (optional)
 * @returns Duration in seconds, or undefined if endTime is not provided
 */
export function calculateDurationSeconds(
    startTime: Date,
    endTime: Date | undefined
): number | undefined {
    if (!endTime) return undefined;
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    return Math.floor((end - start) / 1000);
}

/**
 * Format duration in seconds to human readable form
 * @param seconds - Duration in seconds
 * @returns Human readable duration (e.g., "5m 30s" or "30s")
 */
export function formatDuration(seconds: number | undefined): string {
    if (seconds === undefined || seconds === null) return "-";
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
}
