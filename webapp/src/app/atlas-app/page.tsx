/**
 * This file is used in Utsillingsvindu 2.0
 * 
 * @description
 * This is the main page for the Atlas application.
 * It includes the sidebar, the main content area, and the minified chatbot.
 * The page is made up of the components "AtlasSidebar", "FrontPage", "SendAppNow".
 * 
 * @features
 * - Sidebar navigation
 * - Main content area
 * - Minified chatbot
 * - Link to the main page
 * 
 * @props
 * - `children` (ReactNode): The React tree that will have access to the form context.
 * 
 * @note
 * - This component is designed to be used in a client-side context.
 * 
 * @usage
 * ```tsx
 * import AtlasPage from './AtlasPage';

 */

"use client";

import React from "react";
import dynamic from 'next/dynamic';
import Link from "next/link";
import { GeistSans } from "geist/font/sans";
import AtlasSidebar from "~/components/AtlasSidebar";
import { SendAppNow } from "~/components/SendAppNow";
import FrontPage from "~/components/FrontPage";

export default function AtlasPage() {
  return (
    <div className={`relative min-h-screen ${GeistSans.variable}`}>
      <AtlasSidebar>
        <FrontPage />
        <SendAppNow />
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
