import React from "react";
import Link from "next/link";
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";
import { AppSidebar } from "../../components/app-sidebar";

export default function AtlasPage() {
  return (
    <div className="relative min-h-screen">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset />

        <Link
          href="/"
          className="fixed bottom-8 left-8 z-50 flex items-center gap-2 text-kartAI-blue transition-colors hover:text-kartAI-blue/80"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Tilbake til hovedsiden
        </Link>
      </SidebarProvider>
    </div>
  );
}
