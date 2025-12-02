import { LinkProps } from "@tanstack/react-router";
import {
    IconHelp,
    IconLayoutDashboard,
    IconCreditCard,
    IconPalette,
    IconSettings,
    IconUsers,
    IconBox,
    IconPackage,
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
                    title: "Payments",
                    url: "/payments" as LinkProps["to"],
                    icon: IconCreditCard,
                },
                {
                    title: "Products",
                    url: "/products" as LinkProps["to"],
                    icon: IconPackage,
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
                            title: "Apps",
                            url: "/settings/apps" as LinkProps["to"],
                            icon: IconBox,
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
