import { useQuery } from "@tanstack/react-query";
import api from "@/api";
import { Line, LineChart, ResponsiveContainer, CartesianGrid, Legend, Tooltip, XAxis, YAxis } from "recharts";
import { API } from "@/api/routes";
import type { OperationsOverviewResponseModel } from "@repo/contracts";

export function OperationsOverview() {
    const { data } = useQuery<OperationsOverviewResponseModel>({
        queryKey: ["operations-overview"],
        queryFn: async () => (await api.get(API.OPERATIONS_OVERVIEW)).data,
    });

    return (
        <ResponsiveContainer width="100%" height={350}>
            <LineChart data={data?.data ?? []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                    contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "var(--radius)",
                    }}
                />
                <Legend />
                <Line type="monotone" dataKey="newReservation" stroke="#3b82f6" name="New Reservation" strokeWidth={2} />
                <Line type="monotone" dataKey="updateReservation" stroke="#10b981" name="Update Reservation" strokeWidth={2} />
                <Line type="monotone" dataKey="cancelReservation" stroke="#ef4444" name="Cancel Reservation" strokeWidth={2} />
                <Line type="monotone" dataKey="searchReservation" stroke="#8b5cf6" name="Search Reservation" strokeWidth={2} />
            </LineChart>
        </ResponsiveContainer>
    );
}

