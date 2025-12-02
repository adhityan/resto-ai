import { create } from "zustand";
import type { UserModel } from "@repo/contracts";

interface AdminState {
    admins: UserModel[];
    setAdmins: (admins: UserModel[]) => void;
    addAdmin: (admin: UserModel) => void;
    removeAdmin: (id: string) => void;
}

export const useAdminsStore = create<AdminState>()((set) => ({
    admins: [],
    setAdmins: (admins) => set(() => ({ admins })),
    addAdmin: (admin) => set((state) => ({ admins: [...state.admins, admin] })),
    removeAdmin: (id) => set((state) => ({ admins: state.admins.filter((a) => a.id !== id) })),
}));
