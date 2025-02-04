"use client";

import DataTable from "./DataTable";
import { columns } from "./columns";
import { applications } from "~/types/application";

import AtlasSidebar from "~/components/AtlasSidebar";

export default function Overview() {
  return (
    <AtlasSidebar>
      <h1 className="p-5  text-xl font-bold">Mine saker</h1>
      <DataTable  columns={columns} data={applications} pageSize={10} />
    </AtlasSidebar>
  );
}
