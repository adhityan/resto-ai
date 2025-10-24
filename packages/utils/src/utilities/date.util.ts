export class DateUtils {
    public static getDateRangeFilter(range?: string): Date | undefined {
        if (!range || range === "all") return undefined;

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        switch (range) {
            case "today":
                return today;
            case "week":
                const weekAgo = new Date(today);
                weekAgo.setDate(today.getDate() - 7);
                return weekAgo;
            case "month":
                const monthAgo = new Date(today);
                monthAgo.setMonth(today.getMonth() - 1);
                return monthAgo;
            case "year":
                const yearAgo = new Date(today);
                yearAgo.setFullYear(today.getFullYear() - 1);
                return yearAgo;
            default:
                return undefined;
        }
    }
}
