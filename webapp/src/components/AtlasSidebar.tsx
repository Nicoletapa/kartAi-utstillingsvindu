import { GeistSans } from "geist/font/sans";
import { SidebarProvider } from "./ui/sidebar";
import dynamic from "next/dynamic";
import ClientSidebar from "./ClientSidebar";

interface AtlasSidebarInterface {
  children: React.ReactNode;
}

const AtlasSidebar: React.FC<AtlasSidebarInterface> = ({ children }) => {
  return (
    <SidebarProvider>
      <ClientSidebar />
      <div
        className={`flex min-h-screen pb-40 ${GeistSans.variable} flex w-full flex-col items-center`}
      >
        {children}
      </div>
    </SidebarProvider>
  );
};

export default AtlasSidebar;
