import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/api";
import { API } from "@/api/routes";
import { useAppsStore } from "@/stores/appsStore";
import { columns } from "./components/apps-columns";
import AppsDrawer from "./components/apps-drawer";
import AppsTable from "./components/apps-table";

export default function AppsPage() {
    const [openAdd, setOpenAdd] = useState(false);
    const setApps = useAppsStore((s) => s.setApps);
    const apps = useAppsStore((s) => s.apps);

    const { data } = useQuery({
        queryKey: ["apps"],
        queryFn: async () => (await api.get(API.APPS)).data,
        refetchOnWindowFocus: false,
    });

    useEffect(() => {
        if (data) setApps(data);
    }, [data, setApps]);

    return (
        <>
            <div className="mb-2 flex flex-wrap items-center justify-between space-y-2">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Apps</h2>
                    <p className="text-muted-foreground">Manage applications and their configurations.</p>
                </div>
            </div>
            <div className="flex-1 overflow-auto">
                <AppsTable data={apps} columns={columns} onAdd={() => setOpenAdd(true)} />
            </div>
            <AppsDrawer open={openAdd} onOpenChange={setOpenAdd} />
        </>
    );
}
