import { GeistSans } from "geist/font/sans";
import { AppSidebar } from "./app-sidebar";
import { SidebarProvider } from "./ui/sidebar";
import Sidebar, { SidebarItem } from "./Sidebar";

interface AtlasSidebarInterface {
  children: React.ReactNode;
}

const AtlasSidebar: React.FC<AtlasSidebarInterface> = ({ children }) => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <div
        className={`flex min-h-screen pb-40 ${GeistSans.variable} flex w-full flex-col items-center`}
      >
        {children}
      </div>
    </SidebarProvider>
  );
};

export default AtlasSidebar;
