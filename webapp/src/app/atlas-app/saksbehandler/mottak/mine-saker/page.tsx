"use client";
import { GeistSans } from "geist/font/sans";
import DataTable from "./DataTable";
import { columns } from "./columns";
import { applications } from "~/types/application";

export default function Overview() {
  return (
    <main
      className={`flex min-h-screen pb-40 ${GeistSans.variable} absolute top-14 ml-36 mr-20 flex min-w-full flex-col items-center px-52`}
    >
      {/* <main className="h-screen flex items-center justify-center flex-col gap-4"> */}
      <h1 className="text-xl font-bold">Mine saker:</h1>
      <DataTable columns={columns} data={applications} pageSize={10} />
    </main>
  );
}
