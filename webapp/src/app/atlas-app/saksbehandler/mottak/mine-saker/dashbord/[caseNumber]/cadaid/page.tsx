import { GeistSans } from "geist/font/sans";
import CadaidPage from "~/components/CADAiD";
import { SidebarProvider } from "~/components/ui/sidebar";
import { AppSidebar } from "~/components/app-sidebar";

export default async function PlantegningsAnalyse() {
  return (
    <div>
      <SidebarProvider>
        <AppSidebar />

        <div
          className={`flex min-h-screen pb-40 ${GeistSans.variable} mx-1/3 flex w-full flex-col items-center`}
        >
          <CadaidPage></CadaidPage>
        </div>
      </SidebarProvider>
    </div>
  );
}
