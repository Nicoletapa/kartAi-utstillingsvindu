import React from 'react'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

export function SendAppNow() {
  return (
    <div className='flex flex-col items-start justify-center h-full max-w-2xl mx-auto border-l-2 px-6 border-kartAI-blue'>
      <h1 className='font-medium text-2xl text-gray-700 text-left'>Vet du allerede at du må søke?</h1>

      <p className='mt-2 text-left text-lg'>
        Dersom du allerede vet at tiltaket krever en byggesøknad eller dispensasjon, 
        kan du starte søknadsprosessen med en gang. Klikk på knappen under for å sende inn en søknad.
      </p>

      <div className="mt-5 w-full flex items-left">
        <Link href="/atlas-app/i-soknad" 
          className="text-kartAI-blue px-4 py-3 group flex items-center gap-2 border-2 rounded-lg border-kartAI-blue bg-white transition-all hover:bg-kartAI-blue hover:text-white" 
        >
          <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
          <span className="relative inline-block">
            Send inn en søknad
          </span>
        </Link>
      </div>
    </div>
  )
}