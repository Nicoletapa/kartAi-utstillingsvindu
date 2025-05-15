import dynamic from 'next/dynamic';
import React from 'react'
import AtlasSidebar from "~/components/AtlasSidebar";
import MyOverview from '~/components/MyOverview';

// Import ClientOnlyWrapper
import ClientOnlyWrapper from "~/components/ClientOnlyWrapper";

export default function MyOverviewPage() {
  const MapChatIntegrationWithNoSSR = dynamic(
    () => import("~/components/MapChatIntegration"),
    { ssr: false }
  );
  
  return (
    <AtlasSidebar>
      <div>
        <MyOverview />
     
        <div className='mt-8' id='main-chatbot-section'>
          <h2 className='flex justify-center text-xl mb-4'>Få veiledning fra chatbotten vår!</h2>
          <ClientOnlyWrapper>
            <MapChatIntegrationWithNoSSR />
          </ClientOnlyWrapper>
        </div>
      </div>
    </AtlasSidebar>
  )
}