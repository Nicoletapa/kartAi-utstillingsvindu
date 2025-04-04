import React from 'react'
import AtlasSidebar from "~/components/AtlasSidebar";
import Meldinger from '~/components/Meldinger';

export default function MessagesPage() {
  return (
    <AtlasSidebar>
      <div>
        <Meldinger />
      </div>
    </AtlasSidebar>
  )
}