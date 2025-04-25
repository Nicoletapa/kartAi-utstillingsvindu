import React from 'react'
import AtlasSidebar from "~/components/AtlasSidebar";
import MyOverview from '~/components/MyOverview';
import SmallChatbot from '~/components/SmallChatbot';

export default function MyOverviewPage() {
  return (
    <AtlasSidebar>
      <div>
        <MyOverview />
      </div>
      <SmallChatbot />
    </AtlasSidebar>
  )
}