import { Injectable, Logger } from "@nestjs/common";
import { DatabaseService, CallStatus, OperationType } from "@repo/database";
import {
    DashboardResponseModel,
    OperationsOverviewResponseModel,
    OperationsDataPointModel,
    CallDurationTrendResponseModel,
    CallDurationDataPointModel,
    LanguageBreakdownResponseModel,
    LanguageDataPointModel,
} from "@repo/contracts";

@Injectable()
export class StatsService {
    private readonly logger = new Logger(StatsService.name);

    constructor(private readonly databaseService: DatabaseService) {}

    /**
     * Compute call duration in seconds from startTime and endTime
     */
    private computeDurationInSeconds(call: {
        startTime: Date;
        endTime: Date | null;
    }): number {
        if (!call.endTime) return 0;
        return Math.round(
            (call.endTime.getTime() - call.startTime.getTime()) / 1000
        );
    }

    /**
     * Get dashboard statistics
     */
    async getDashboardStats(): Promise<DashboardResponseModel> {
        this.logger.log("Fetching dashboard stats");

        const now = new Date();
        const startOfCurrentMonth = new Date(
            now.getFullYear(),
            now.getMonth(),
            1
        );
        const startOfLastMonth = new Date(
            now.getFullYear(),
            now.getMonth() - 1,
            1
        );
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        // Get current month calls with reservations
        const currentMonthCalls = await this.databaseService.call.findMany({
            where: {
                startTime: { gte: startOfCurrentMonth },
            },
            include: { reservations: true },
        });

        // Get last month calls with reservations
        const lastMonthCalls = await this.databaseService.call.findMany({
            where: {
                startTime: {
                    gte: startOfLastMonth,
                    lte: endOfLastMonth,
                },
            },
            include: { reservations: true },
        });

        // Calculate stats
        const currentCallCount = currentMonthCalls.length;
        const lastCallCount = lastMonthCalls.length;

        const currentDuration = currentMonthCalls.reduce(
            (sum, call) => sum + this.computeDurationInSeconds(call),
            0
        );
        const lastDuration = lastMonthCalls.reduce(
            (sum, call) => sum + this.computeDurationInSeconds(call),
            0
        );

        const currentEscalations = currentMonthCalls.filter(
            (c) => c.escalationRequested
        ).length;
        const lastEscalations = lastMonthCalls.filter(
            (c) => c.escalationRequested
        ).length;

        // Count total reservations across all calls
        const currentReservations = currentMonthCalls.reduce(
            (sum, c) => sum + c.reservations.length,
            0
        );
        const lastReservations = lastMonthCalls.reduce(
            (sum, c) => sum + c.reservations.length,
            0
        );

        const calculateChangePct = (
            current: number,
            previous: number
        ): number => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return Math.round(((current - previous) / previous) * 100);
        };

        return new DashboardResponseModel({
            totalReservations: {
                current: currentReservations,
                changePct: calculateChangePct(
                    currentReservations,
                    lastReservations
                ),
            },
            totalCalls: {
                current: currentCallCount,
                changePct: calculateChangePct(currentCallCount, lastCallCount),
            },
            totalCallDuration: {
                current: Math.round(currentDuration / 60), // Convert to minutes
                changePct: calculateChangePct(currentDuration, lastDuration),
            },
            managerEscalations: {
                current: currentEscalations,
                changePct: calculateChangePct(
                    currentEscalations,
                    lastEscalations
                ),
            },
        });
    }

    /**
     * Get operations overview for the last 30 days
     */
    async getOperationsOverview(): Promise<OperationsOverviewResponseModel> {
        this.logger.log("Fetching operations overview");

        const now = new Date();
        const thirtyDaysAgo = new Date(
            now.getTime() - 30 * 24 * 60 * 60 * 1000
        );

        // Get operation logs from last 30 days
        const logs = await this.databaseService.operationLog.findMany({
            where: {
                createdAt: { gte: thirtyDaysAgo },
            },
            orderBy: { createdAt: "asc" },
        });

        // Initialize data for each day
        const dataByDate = new Map<string, OperationsDataPointModel>();
        for (let i = 0; i < 30; i++) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dateStr = date.toISOString().split("T")[0];
            dataByDate.set(
                dateStr,
                new OperationsDataPointModel({
                    date: dateStr,
                    newReservation: 0,
                    updateReservation: 0,
                    cancelReservation: 0,
                    searchReservation: 0,
                })
            );
        }

        // Count operations by type and date
        logs.forEach((log) => {
            const dateStr = log.createdAt.toISOString().split("T")[0];
            const existing = dataByDate.get(dateStr);
            if (existing) {
                switch (log.type) {
                    case OperationType.CREATE_RESERVATION:
                        existing.newReservation += 1;
                        break;
                    case OperationType.UPDATE_RESERVATION:
                        existing.updateReservation += 1;
                        break;
                    case OperationType.CANCEL_RESERVATION:
                        existing.cancelReservation += 1;
                        break;
                    case OperationType.SEARCH_RESERVATION:
                        existing.searchReservation += 1;
                        break;
                }
            }
        });

        const data = Array.from(dataByDate.values()).sort((a, b) =>
            a.date.localeCompare(b.date)
        );

        return new OperationsOverviewResponseModel(data);
    }

    /**
     * Get call duration trend for the last 30 days
     */
    async getCallDurationTrend(): Promise<CallDurationTrendResponseModel> {
        this.logger.log("Fetching call duration trend");

        const now = new Date();
        const thirtyDaysAgo = new Date(
            now.getTime() - 30 * 24 * 60 * 60 * 1000
        );

        const calls = await this.databaseService.call.findMany({
            where: {
                startTime: { gte: thirtyDaysAgo },
                status: CallStatus.COMPLETED,
            },
            orderBy: { startTime: "asc" },
        });

        // Group by date
        const dataByDate = new Map<
            string,
            { totalDuration: number; callCount: number }
        >();

        for (let i = 0; i < 30; i++) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dateStr = date.toISOString().split("T")[0];
            dataByDate.set(dateStr, { totalDuration: 0, callCount: 0 });
        }

        calls.forEach((call) => {
            const dateStr = call.startTime.toISOString().split("T")[0];
            const existing = dataByDate.get(dateStr);
            if (existing) {
                existing.totalDuration += Math.round(
                    this.computeDurationInSeconds(call) / 60
                ); // Convert to minutes
                existing.callCount += 1;
            }
        });

        const data = Array.from(dataByDate.entries())
            .map(
                ([date, stats]) =>
                    new CallDurationDataPointModel({
                        date,
                        totalDuration: stats.totalDuration,
                        callCount: stats.callCount,
                    })
            )
            .sort((a, b) => a.date.localeCompare(b.date));

        return new CallDurationTrendResponseModel(data);
    }

    /**
     * Get language breakdown for the last 30 days
     */
    async getLanguageBreakdown(): Promise<LanguageBreakdownResponseModel> {
        this.logger.log("Fetching language breakdown");

        const now = new Date();
        const thirtyDaysAgo = new Date(
            now.getTime() - 30 * 24 * 60 * 60 * 1000
        );

        const calls = await this.databaseService.call.findMany({
            where: {
                startTime: { gte: thirtyDaysAgo },
            },
            orderBy: { startTime: "asc" },
        });

        // Group by date and language
        const dataPoints: LanguageDataPointModel[] = [];
        const totalByLanguage: Record<string, number> = {};
        const dateLanguageMap = new Map<string, Map<string, number>>();

        calls.forEach((call) => {
            const dateStr = call.startTime.toISOString().split("T")[0];

            // Split comma-separated languages and process each one
            const languages = call.languages
                .split(",")
                .map((lang) => lang.trim())
                .filter((lang) => lang.length > 0);

            languages.forEach((language) => {
                // Update daily counts
                if (!dateLanguageMap.has(dateStr)) {
                    dateLanguageMap.set(dateStr, new Map());
                }
                const languageMap = dateLanguageMap.get(dateStr)!;
                languageMap.set(language, (languageMap.get(language) || 0) + 1);

                // Update totals
                totalByLanguage[language] =
                    (totalByLanguage[language] || 0) + 1;
            });
        });

        // Convert to data points
        dateLanguageMap.forEach((languageMap, date) => {
            languageMap.forEach((count, language) => {
                dataPoints.push(
                    new LanguageDataPointModel({
                        date,
                        language,
                        count,
                    })
                );
            });
        });

        dataPoints.sort((a, b) => a.date.localeCompare(b.date));

        return new LanguageBreakdownResponseModel(dataPoints, totalByLanguage);
    }
}
