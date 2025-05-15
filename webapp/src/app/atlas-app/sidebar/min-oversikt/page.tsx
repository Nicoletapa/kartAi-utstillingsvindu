import dynamic from 'next/dynamic';
import React from 'react'
import AtlasSidebar from "~/components/AtlasSidebar";
import MyOverview from '~/components/MyOverview';

export default function MyOverviewPage() {
  const MapChatIntegrationWithNoSSR = dynamic(
    () => import("~/components/MapChatIntegration"),
    { ssr: false }
  );
  return (
    <AtlasSidebar>
      <MyOverview />
      <div className='mt-10'>
        <MapChatIntegrationWithNoSSR />
      </div>
    </AtlasSidebar>
  )
}