import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/api";
import { Line, LineChart, ResponsiveContainer, CartesianGrid, Legend, Tooltip, XAxis, YAxis } from "recharts";
import { API } from "@/api/routes";
import type { RevenueAppBreakdownResponseModel } from "@repo/contracts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

export function RevenueAppBreakdown() {
    const { data: revenueData } = useQuery<RevenueAppBreakdownResponseModel[]>({
        queryKey: ["revenue-app-breakdown"],
        queryFn: async () => (await api.get(API.REVENUE_APP_BREAKDOWN)).data,
    });

    const appNames = useMemo(() => {
        if (!revenueData) return [];
        const apps = new Set<string>();
        revenueData.forEach((item) => {
            Object.keys(item).forEach((key) => {
                if (key !== "month") apps.add(key);
            });
        });
        return Array.from(apps);
    }, [revenueData]);

    return (
        <ResponsiveContainer width="100%" height={350}>
            <LineChart data={revenueData ?? []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" fontSize={12} axisLine={false} tickLine={false} />
                <YAxis fontSize={12} axisLine={false} tickLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip
                    formatter={(value: number) => [`$${value}`, ""]}
                    contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "var(--radius)",
                    }}
                />
                <Legend />
                {appNames.map((appName, idx) => (
                    <Line
                        key={appName}
                        type="monotone"
                        dataKey={appName}
                        stroke={COLORS[idx % COLORS.length]}
                        strokeWidth={2}
                        name={appName}
                    />
                ))}
            </LineChart>
        </ResponsiveContainer>
    );
}
