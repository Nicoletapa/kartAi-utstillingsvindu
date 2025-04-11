import React from 'react'
import AtlasSidebar from "~/components/AtlasSidebar";
import MyOverview from '~/components/MyOverview';

export default function MyOverviewPage() {
  return (
    <AtlasSidebar>
      <div>
        <MyOverview />
      </div>
    </AtlasSidebar>
  )
}