"use client";

import type * as React from "react";
import { BookOpen, Bot, Settings2, SquareTerminal } from "lucide-react";
import { usePathname } from "next/navigation";
import { NavMain } from "./nav-main";
import { Sidebar, SidebarContent, SidebarRail } from "~/components/ui/sidebar";

// This is sample data.
const data = {
  navMain: [
    {
      title: "Før du søker",
      url: "/atlas-app",
      icon: SquareTerminal,
      isActive: true,
    },
    {
      title: "Sjekkliste",

      url: "/atlas-app#sjekkliste-oversikt",

      icon: Bot,
    },
    {
      title: "CADAiD",
      url: "/atlas-app/sidebar/cadaid",
      icon: BookOpen,
    },
    {
      title: "3D-Modellering",
      url: "/atlas-app/sidebar/3d-situasjon",
      icon: Settings2,
    },
    {
      title: "Min Eiendom",
      url: "/atlas-app/sidebar/arkivgpt",
      icon: Settings2,
    },
    {
      title: "TiltaksAid",
      url: "/atlas-app/sidebar/Tiltaksaid",
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
  const pathname = usePathname();
  const isAtlasApp = pathname?.includes("atlas-app");

  if (!isAtlasApp) {
    return null;
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
