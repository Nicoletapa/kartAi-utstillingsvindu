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
     
      <div className='mt-8' id='main-chatbot-section'>
        <h2 className='flex justify-center text-xl mb-4'>Få veiledning fra chatbotten vår!</h2>
        <MapChatIntegrationWithNoSSR />
      </div>

    </AtlasSidebar>
  )
}