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

