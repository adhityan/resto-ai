import { LinkProps } from "@tanstack/react-router";
import {
    IconHelp,
    IconLayoutDashboard,
    IconPhone,
    IconPalette,
    IconSettings,
    IconUsers,
    IconBuildingStore,
    IconCalendarEvent,
} from "@tabler/icons-react";
import { type SidebarData } from "../types";

export const sidebarData: SidebarData = {
    navGroups: [
        {
            title: "General",
            items: [
                {
                    title: "Dashboard",
                    url: "/",
                    icon: IconLayoutDashboard,
                },
                {
                    title: "Calls",
                    url: "/calls" as LinkProps["to"],
                    icon: IconPhone,
                },
                {
                    title: "Reservations",
                    url: "/reservations" as LinkProps["to"],
                    icon: IconCalendarEvent,
                },
                {
                    title: "Customers",
                    url: "/customers" as LinkProps["to"],
                    icon: IconUsers,
                },
            ],
        },
        {
            title: "Admin",
            items: [
                {
                    title: "Settings",
                    icon: IconSettings,
                    items: [
                        {
                            title: "Restaurants",
                            url: "/settings/restaurants" as LinkProps["to"],
                            icon: IconBuildingStore,
                        },
                        {
                            title: "Admins",
                            url: "/settings/admins" as LinkProps["to"],
                            icon: IconUsers,
                        },
                        {
                            title: "Appearance",
                            url: "/settings/appearance",
                            icon: IconPalette,
                        },
                    ],
                },
                {
                    title: "Help Center",
                    url: "/help-center",
                    icon: IconHelp,
                },
            ],
        },
    ],
};
