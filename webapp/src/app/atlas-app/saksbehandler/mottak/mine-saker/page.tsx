"use client";
import { GeistSans } from "geist/font/sans";
import DataTable from "./DataTable";
import { columns } from "./columns";
import { applications } from "~/types/application";
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";
import { AppSidebar } from "~/components/app-sidebar";

export default function Overview() {
  return (
    <div>
      <SidebarProvider>
        <AppSidebar />

        <SidebarInset />
      </SidebarProvider>
      <main
        className={`flex min-h-screen pb-40 ${GeistSans.variable} absolute top-14 ml-36 mr-20 flex min-w-full flex-col items-center px-52 py-10`}
      >
        {/* <main className="h-screen flex items-center justify-center flex-col gap-4"> */}
        <h1 className="p-5 text-xl font-bold">Mine saker</h1>
        <DataTable columns={columns} data={applications} pageSize={10} />
      </main>
    </div>
  );
}
