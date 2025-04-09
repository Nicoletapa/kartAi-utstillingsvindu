"use client";

import React from "react";
import Link from "next/link";
import { GeistSans } from "geist/font/sans";
import AtlasSidebar from "~/components/AtlasSidebar";
import dynamic from "next/dynamic";
import { SendAppNow } from "~/components/SendAppNow";
const MapChatIntegrationWithNoSSR = dynamic(
  () => import("~/components/MapChatIntegration"),
  { ssr: false } 
);

export default function AtlasPage() {
  return (
    <div className={`relative min-h-screen ${GeistSans.variable}`}>
      <h1 className="flex justify-center pt-8 text-4xl text-kartAI-blue font-medium">Før du søker</h1>
      <div className="lg:w-3/4 mx-auto mt-8 mb-0">
        <MapChatIntegrationWithNoSSR/>
      </div>

      <SendAppNow />

      <AtlasSidebar>
        <></>
      </AtlasSidebar>
        
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
  );
}
