"use client";

import type * as React from "react";
import { BookOpen, Bot, Settings2, SquareTerminal } from "lucide-react";

import { NavMain } from "./nav-main";

import { Sidebar, SidebarContent, SidebarRail } from "~/components/ui/sidebar";

// This is sample data.
const data = {
  navMain: [
    {
      title: "Før du søker",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
    },
    {
      title: "Sjekkliste",
      url: "#sjekkliste-oversikt",
      icon: Bot,
    },
    {
      title: "CADAiD",
      url: "#",
      icon: BookOpen,
    },
    {
      title: "3D-Modellering",
      url: "#",
      icon: Settings2,
    },
    {
      title: "Min Eiendom",
      url: "",
      icon: Settings2,
    },
    {
      title: "Mine Byggesaker",
      url: "#",
      icon: Settings2,
    },
    {
      title: "Saksbehandler",
      url: "/atlas-app/saksbehandler/mottak/mine-saker/",
      icon: Settings2,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
