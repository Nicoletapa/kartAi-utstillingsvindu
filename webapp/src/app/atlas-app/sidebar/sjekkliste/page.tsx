import React from 'react'
import AtlasSidebar from "~/components/AtlasSidebar";
import { SjekklisteOversikt } from '~/components/sjekkliste-oversikt';

export default function SjekklistePage() {
  return (
    <AtlasSidebar>
      <div>
        <SjekklisteOversikt />
      </div>
    </AtlasSidebar>
  )
}