import { GeistSans } from "geist/font/sans";
import ArkivGPTPage from "~/components/ArkivGPT";
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";
import { AppSidebar } from "~/components/app-sidebar";

export default async function ArkivGPT() {
  return (
    <div>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset />
      </SidebarProvider>
      <div
        className={`flex min-h-screen pb-40 ${GeistSans.variable} absolute top-14 ml-36 mr-20 flex min-w-full flex-col items-center px-52`}
      >
        <ArkivGPTPage />
      </div>
    </div>
  );
}
