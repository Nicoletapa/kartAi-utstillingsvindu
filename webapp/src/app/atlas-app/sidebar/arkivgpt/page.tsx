"use client";

import ArkivGPTPage from "~/components/ArkivGPT";
import AtlasSidebar from "~/components/AtlasSidebar";

export default async function ArkivGPT() {
  return (
    <AtlasSidebar>
      <ArkivGPTPage />
    </AtlasSidebar>
  );
}
