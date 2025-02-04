"use client";

import type * as React from "react";
import { BookOpen, Bot, Settings2, SquareTerminal } from "lucide-react";

import { NavMain } from "./nav-main";

import { Sidebar, SidebarContent, SidebarRail } from "~/components/ui/sidebar";
import { useEffect, useState } from "react";

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
      url: "#",
      icon: Bot,
    },
    {
      title: "CadAId",
      url: "#",
      icon: BookOpen,
    },
    {
      title: "3d-Modellering",
      url: "#",
      icon: Settings2,
    },
    {
      title: "Min Eiendom",
      url: "",
      icon: Settings2,
    },
    {
      title: "Mine byggesaker",
      url: "#",
      icon: Settings2,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {

  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isAtlasApp, setIsAtlasApp] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsAtlasApp(pathname?.includes("atlas-app") ?? false);
  }, [pathname]);

  if (!mounted) {
    return (
      <div className="min-h-screen w-[280px]">
        {/* Placeholder with same dimensions */}
      </div>
    );
  }

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
