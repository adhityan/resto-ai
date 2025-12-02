import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/api";
import { API } from "@/api/routes";
import { useAdminsStore } from "@/stores/adminsStore";
import type { UserModel } from "@repo/contracts";
import { columns } from "./components/admins-columns";
import AdminsDrawer from "./components/admins-drawer";
import AdminsTable from "./components/admins-table";

export default function AdminsPage() {
    const [openAdd, setOpenAdd] = useState(false);
    const setAdmins = useAdminsStore((s) => s.setAdmins);
    const admins = useAdminsStore((s) => s.admins);

    const { data } = useQuery<UserModel[]>({
        queryKey: ["admins"],
        queryFn: async () => (await api.get(API.ADMINS)).data,
        refetchOnWindowFocus: false,
    });

    useEffect(() => {
        if (data) setAdmins(data);
    }, [data, setAdmins]);

    return (
        <>
            <div className="mb-2 flex flex-wrap items-center justify-between space-y-2">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Admins</h2>
                    <p className="text-muted-foreground">Manage admin users.</p>
                </div>
                {/* Add button moved into toolbar */}
            </div>
            <div className="flex-1 overflow-auto">
                <AdminsTable data={admins} columns={columns} onAdd={() => setOpenAdd(true)} />
            </div>
            <AdminsDrawer open={openAdd} onOpenChange={setOpenAdd} />
        </>
    );
}
