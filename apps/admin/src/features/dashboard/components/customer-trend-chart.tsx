import { useQuery } from "@tanstack/react-query";
import api from "@/api";
import { Line, LineChart, ResponsiveContainer, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { API } from "@/api/routes";
import type { CustomerTrendResponseModel } from "@repo/contracts";

export function CustomerTrendChart() {
    const { data } = useQuery<CustomerTrendResponseModel[]>({
        queryKey: ["customer-trend"],
        queryFn: async () => (await api.get(API.CUSTOMER_TREND)).data,
    });

    return (
        <ResponsiveContainer width="100%" height={350}>
            <LineChart data={data ?? []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" fontSize={12} axisLine={false} tickLine={false} />
                <YAxis fontSize={12} axisLine={false} tickLine={false} />
                <Tooltip
                    contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "var(--radius)",
                    }}
                />
                <Line type="monotone" dataKey="newCustomers" stroke="#3b82f6" strokeWidth={2} name="New Customers" />
            </LineChart>
        </ResponsiveContainer>
    );
}
