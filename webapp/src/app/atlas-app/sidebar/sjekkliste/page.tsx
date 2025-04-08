import React from 'react'
import AtlasSidebar from "~/components/AtlasSidebar";
import ChecklistAtlas from '~/components/ChecklistAtlas';

export default function SjekklistePage() {
  return (
    <AtlasSidebar>
      <div>
        <ChecklistAtlas />
      </div>
    </AtlasSidebar>
  )
}