import { useQuery } from "@tanstack/react-query";
import api from "@/api";
import { Line, LineChart, ResponsiveContainer, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { API } from "@/api/routes";
import type { CallDurationTrendResponseModel } from "@repo/contracts";

export function CallDurationTrendChart() {
    const { data } = useQuery<CallDurationTrendResponseModel>({
        queryKey: ["call-duration-trend"],
        queryFn: async () => (await api.get(API.CALL_DURATION_TREND)).data,
    });

    return (
        <ResponsiveContainer width="100%" height={350}>
            <LineChart data={data?.data ?? []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" fontSize={12} axisLine={false} tickLine={false} />
                <YAxis fontSize={12} axisLine={false} tickLine={false} tickFormatter={(value) => `${value}m`} />
                <Tooltip
                    formatter={(value: number, name: string) => [
                        name === "totalDuration" ? `${value} min` : value,
                        name === "totalDuration" ? "Duration" : "Calls",
                    ]}
                    contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "var(--radius)",
                    }}
                />
                <Line type="monotone" dataKey="totalDuration" stroke="#3b82f6" strokeWidth={2} name="Call Duration (min)" />
            </LineChart>
        </ResponsiveContainer>
    );
}

