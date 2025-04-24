import React from 'react'
import AtlasSidebar from "~/components/AtlasSidebar";
import MyDocuments from "~/components/MyDocuments";
import SmallChatbot from "~/components/SmallChatbot";

export default function DocumentsPage() {
  return (
    <AtlasSidebar>
      <div>
        <MyDocuments />
      </div>
      <SmallChatbot />
    </AtlasSidebar>
  )
}


