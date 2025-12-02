import { useQuery } from "@tanstack/react-query";
import api from "@/api";
import { Line, LineChart, ResponsiveContainer, CartesianGrid, Legend, Tooltip, XAxis, YAxis } from "recharts";
import { API } from "@/api/routes";
import type { RevenueOverviewResponseModel } from "@repo/contracts";

export function RevenueOverview() {
    const { data } = useQuery<RevenueOverviewResponseModel[]>({
        queryKey: ["revenue-overview"],
        queryFn: async () => (await api.get(API.REVENUE_OVERVIEW)).data,
    });

    return (
        <ResponsiveContainer width="100%" height={350}>
            <LineChart data={data ?? []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip
                    formatter={(value: number) => [`$${value.toFixed(2)}`, ""]}
                    contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "var(--radius)",
                    }}
                />
                <Legend />
                <Line type="monotone" dataKey="paymentsRevenue" stroke="#3b82f6" name="Payments Revenue" strokeWidth={2} />
                <Line type="monotone" dataKey="subscriptionsRevenue" stroke="#10b981" name="Subscriptions Revenue" strokeWidth={2} />
                <Line type="monotone" dataKey="totalRevenue" stroke="#8b5cf6" name="Total Revenue" strokeWidth={2} />
            </LineChart>
        </ResponsiveContainer>
    );
}
