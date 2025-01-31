import React from "react";
import Link from "next/link";

import { GeistSans } from "geist/font/sans";

import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";
import { AppSidebar } from "~/components/app-sidebar";
import TiltaksAid from "~/components/TiltaksAid";

export default function TiltaksAidPage() {
  return (
    <div>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset />
      </SidebarProvider>
      <div
        className={`flex min-h-screen pb-40 ${GeistSans.variable} absolute top-14 ml-36 mr-20 flex min-w-full flex-col items-center px-52`}
      >
        <h1 className="flex justify-center pt-10 text-4xl">TiltaksAid</h1>
        <div className="mt-10 w-full max-w-5xl">
          <TiltaksAid />
        </div>

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
      </div>
    </div>
  );
}
