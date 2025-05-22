import React from 'react'
import AtlasSidebar from "~/components/AtlasSidebar";
import Meldinger from '~/components/Meldinger';

export default function MessagesPage() {
  return (
    <AtlasSidebar>
      <Meldinger />
    </AtlasSidebar>
  )
}