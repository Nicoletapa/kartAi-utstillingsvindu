import React from "react";
import Link from "next/link";

import { GeistSans } from "geist/font/sans";
import { ArrowRight } from "lucide-react";
import { SjekklisteOversikt } from "~/components/sjekkliste-oversikt";

export default function AtlasPage() {
  return (
    <div
      className={`flex min-h-screen pb-40 ${GeistSans.variable} absolute top-14 ml-36 mr-20 flex min-w-full flex-col items-center px-52`}
    >
      <h1 className="flex justify-center pt-10 text-4xl">Før du søker</h1>
      <div className="mx-auto mt-36 flex h-40 w-1/3 items-center justify-center rounded-lg border-4 border-solid p-10 align-middle">
        {" "}
        placeholder
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

      <Link
        href="/atlas-app/i-soknad"
        className="group fixed bottom-8 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border-2 border-kartAI-blue bg-white px-6 py-3 text-kartAI-blue"
      >
        <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
        <span className="relative inline-block">
          Send inn en søknad
          <span className="absolute bottom-0 left-0 h-1 w-0 bg-kartAI-blue transition-all duration-300 group-hover:w-full"></span>
        </span>
      </Link>
      <div className="relative pt-80">
        <SjekklisteOversikt />
      </div>
    </div>
  );
}
