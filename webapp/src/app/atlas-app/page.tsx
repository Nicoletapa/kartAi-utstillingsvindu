import React from "react";
import Link from "next/link";
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";
import { AppSidebar } from "../../components/app-sidebar";
import { GeistSans } from "geist/font/sans";
import { ArrowRight } from "lucide-react";

export default function AtlasPage() {
  return (
    <div className={`relative min-h-screen ${GeistSans.variable}`}>
      <h1 className="flex justify-center pt-10 text-4xl">Før du søker</h1>
      <div className="mx-auto mt-36 flex h-40 w-1/3 items-center justify-center rounded-lg border-4 border-solid p-10 align-middle">
        {" "}
        placeholder
      </div>
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
      
      <Link href="/atlas-app/i-soknad" className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 text-kartAI-blue px-6 py-3 group flex items-center gap-2" 
        >
        <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
        <span className="relative inline-block">
          Send inn en søknad
          <span className="absolute bottom-0 left-0 w-0 h-1 bg-kartAI-blue transition-all duration-300 group-hover:w-full"></span>
        </span>
        </Link>
    </div>
  );
}
