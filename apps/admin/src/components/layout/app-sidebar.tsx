import { Command } from "lucide-react";
import { Sidebar, SidebarContent, SidebarRail, SidebarHeader, useSidebar } from "@/components/ui/sidebar";
import { NavGroup } from "@/components/layout/nav-group";
import { sidebarData } from "./data/sidebar-data";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const { state } = useSidebar();
    const isCollapsed = state === "collapsed";

    return (
        <Sidebar collapsible="icon" variant="floating" {...props}>
            <SidebarHeader>
                <div className={`flex items-center gap-2 py-2 ${isCollapsed ? "justify-center px-1" : "px-2"}`}>
                    <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
                        <Command size={18} />
                    </span>
                    {!isCollapsed && <span className="text-lg font-semibold">Payments Admin</span>}
                </div>
            </SidebarHeader>
            <SidebarContent>
                {sidebarData.navGroups.map((props) => (
                    <NavGroup key={props.title} {...props} />
                ))}
            </SidebarContent>
            {/* SidebarFooter intentionally left empty to remove user card */}
            <SidebarRail />
        </Sidebar>
    );
}
