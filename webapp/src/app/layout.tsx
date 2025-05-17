/**
 * This file is used in Utsillingsvindu 1.0 and 2.0
 * 
 * @description
 * This is the root layout for the overall application.
 * It includes the global styles, metadata, and the main layout structure.
 * 
 * @features
 * - Global styles
 * - Metadata for the application
 * - Navbar and footer components
 * - Session management
 * - Providers for context and state management
 * 
 * @props
 * - `children` (ReactNode): The React tree that will have access to the form context.
 * 
 * @note
 * - This component is designed to be used in a server-side context.
 * 
 * @usage
 * 
 */

import "~/styles/globals.css";
import "leaflet/dist/leaflet.css";
import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getServerAuthSession } from "~/server/auth";
import Providers from "../components/Providers";
import { Toaster } from "react-hot-toast";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "KartAI AI-modeller",
  description:
    "Dette er en tjeneste som viser hvordan de ulike KI-assistentene til Norkart kan brukes til å effektivisere og hjelpe innbyggere og saksbehandlere med byggesøknader.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const SmallChatbotWithNoSSR = dynamic(
  () => import('~/components/SmallChatbot'),
  { ssr: false }
);

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getServerAuthSession();

  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      <body className="min-h-screen">
        <Providers session={session!}>
          <Navbar />
          <div className="flex flex-col">
            <main className="flex-1">{children}</main>
            <Toaster position="bottom-right" />
            <Footer />
          </div>
          <SmallChatbotWithNoSSR />
        </Providers>
      </body>
    </html>
  );
}

