import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/api";
import { Line, LineChart, ResponsiveContainer, CartesianGrid, Legend, Tooltip, XAxis, YAxis } from "recharts";
import { API } from "@/api/routes";
import type { LanguageBreakdownResponseModel } from "@repo/contracts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

export function LanguageBreakdown() {
    const { data: languageData } = useQuery<LanguageBreakdownResponseModel>({
        queryKey: ["language-breakdown"],
        queryFn: async () => (await api.get(API.LANGUAGE_BREAKDOWN)).data,
    });

    // Transform data for chart - group by date with languages as columns
    const { chartData, languages, totals } = useMemo(() => {
        if (!languageData?.data) return { chartData: [] as Record<string, string | number>[], languages: [] as string[], totals: {} as Record<string, number> };

        const dateMap = new Map<string, Record<string, string | number>>();
        const languageSet = new Set<string>();

        languageData.data.forEach((item) => {
            languageSet.add(item.language);
            const existing = dateMap.get(item.date) || { date: item.date };
            existing[item.language] = item.count;
            dateMap.set(item.date, existing);
        });

        const sortedData = Array.from(dateMap.values()).sort((a, b) =>
            String(a.date).localeCompare(String(b.date))
        );

        return {
            chartData: sortedData,
            languages: Array.from(languageSet),
            totals: languageData.totalByLanguage || {},
        };
    }, [languageData]);

    return (
        <div className="space-y-4">
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" fontSize={12} axisLine={false} tickLine={false} />
                    <YAxis fontSize={12} axisLine={false} tickLine={false} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "hsl(var(--background))",
                            borderColor: "hsl(var(--border))",
                            borderRadius: "var(--radius)",
                        }}
                    />
                    <Legend />
                    {languages.map((lang, idx) => (
                        <Line
                            key={lang}
                            type="monotone"
                            dataKey={lang}
                            stroke={COLORS[idx % COLORS.length]}
                            strokeWidth={2}
                            name={lang}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
            {Object.keys(totals).length > 0 && (
                <div className="flex flex-wrap gap-4 pt-2 border-t">
                    {Object.entries(totals).map(([lang, count], idx) => (
                        <div key={lang} className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                            />
                            <span className="text-sm text-muted-foreground">
                                {lang}: <span className="font-medium text-foreground">{count}</span>
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

