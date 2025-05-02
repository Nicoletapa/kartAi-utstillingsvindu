import React from 'react'
import AtlasSidebar from "~/components/AtlasSidebar";
import ForDuSoker from '~/components/ForDuSoker';
import SmallChatbot from '~/components/SmallChatbot';

export default function ForDuSokerPage() {
  return (
    <AtlasSidebar>
      <div>
        <ForDuSoker />
      </div>
      <SmallChatbot />
    </AtlasSidebar>
  )
}