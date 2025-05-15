import React from 'react'
import AtlasSidebar from "~/components/AtlasSidebar";
import Meldinger from '~/components/Meldinger';
import SmallChatbot from '~/components/SmallChatbot';

export default function MessagesPage() {
  return (
    <AtlasSidebar>
      <Meldinger />
      <SmallChatbot />
    </AtlasSidebar>
  )
}