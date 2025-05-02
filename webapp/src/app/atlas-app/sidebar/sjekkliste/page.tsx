import React from 'react'
import AtlasSidebar from "~/components/AtlasSidebar";
import ChecklistAtlas from '~/components/ChecklistAtlas';
import SmallChatbot from '~/components/SmallChatbot';

export default function SjekklistePage() {
  return (
    <AtlasSidebar>
      <div>
        <ChecklistAtlas />
      </div>
      <SmallChatbot />
    </AtlasSidebar>
  )
}