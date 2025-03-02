"use client";

import React from "react";
import Link from "next/link";
import { GeistSans } from "geist/font/sans";
import { ArrowRight } from "lucide-react";
import { SjekklisteOversikt } from "~/components/sjekkliste-oversikt";
import AtlasSidebar from "~/components/AtlasSidebar";
import dynamic from "next/dynamic";

// Dynamically import the MapChatIntegration component with SSR disabled
const MapChatIntegrationWithNoSSR = dynamic(
  () => import("~/components/MapChatIntegration"),
  { ssr: false } // This prevents server-side rendering
);

export default function AtlasPage() {
  return (
    <div className={`relative min-h-screen ${GeistSans.variable}`}>
      <h1 className="flex justify-center pt-6 text-4xl">Før du søker</h1>
      <div className="lg:w-3/4 mx-auto mt-6">
        <MapChatIntegrationWithNoSSR/>
   </div>
      <AtlasSidebar>
        
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
        </AtlasSidebar>
      <Link href="/atlas-app/i-soknad" className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 text-kartAI-blue px-6 py-3 group flex items-center gap-2 border-2 rounded-full border-kartAI-blue bg-white" 
        >
        <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
        <span className="relative inline-block">
          Send inn en søknad
          <span className="absolute bottom-[-2px] left-0 w-0 h-1 bg-kartAI-blue transition-all duration-300 group-hover:w-full"></span>
        </span>
        </Link>

        <SjekklisteOversikt />
    </div>
  );
}
