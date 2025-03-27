"use client";

import React, { useState } from 'react'
import { ArrowRight, ArrowLeft, Info } from 'lucide-react'
import { useRouter } from "next/navigation";
import { Button } from "../../../components/ui/button";

const personalData = [
  { label: "Navn:", value: "[Fornavn] [Etternavn]"},
  { label: "E-post:", value: "[E-post]"},
  { label: "Telefon:", value: "[Telefonnummer]"},
  { label: "Mobil:", value: "[Mobilnummer]"},
  { label: "Adresse:", value: "[Adresse]"},
]

const propertyData = [
  { label: "Adresse:", value: "[Adresse]"},
  { label: "Postnr/sted:", value: "[Postnr], [Sted]"},
  { label: "Gårdsnummer:", value: "[Gårdsnummer]"},
  { label: "Festenummer:", value: "[Festenummer]"},
  { label: "Seksjonsnummer:", value: "[Seksjonsnummer]"},
]

const ownerData = [
  { label: "Eiendomsareal:", value: "[Eiendomsareal]"},
  { label: "Eierbrøk:", value: "[Eierbrøk]"},
]

const App = () => {
      const [hoveredBox, setHoveredBox] = useState<string | null>(null);
      const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  
      const router = useRouter();

      const handleBack = () => {
        router.push("/atlas-app");
    };

    const handleNext = () => {
      router.push("/atlas-app/i-soknad/hva-vil-du-gjore");
    }
    const handleMouseEnter = (box: string) => {
      if (timeoutId) clearTimeout(timeoutId);
      setHoveredBox(box);
  };

  const handleMouseLeave = () => {
      const id = setTimeout(() => setHoveredBox(null), 300);
      setTimeoutId(id);
  };
  
  return (
    <div className="flex flex-col items-center justify-center h-full mt-16">
        <h1 className="text-3xl font-bold justify-center flex">Dine opplysninger</h1>

        <div className="border-2 border-gray-400 rounded-lg mt-4 p-4 lg:w-[950px]" data-cy="main-container">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-2/6" data-cy="left-column">
            <h1 className='font-medium mb-4'>Personopplysninger</h1>
            <div className='flex-1 space-y-2'>
              {personalData.map((field, index) => (
                <div key={index} className="flex">
                    <p className="font-medium mr-1">{field.label}</p>
                    <span>{field.value}</span>
                </div>
                ))}
            </div>
            
          </div>

          <div className="w-full md:w-4/6 md:border-l-2 md:border-gray-400 md:pl-8" data-cy="right-column">
    <h1 className='font-medium inline-flex'>
        Eiendom
        <div className="relative flex">
            <Info
                size={14}
                className="ml-1 hover:cursor-pointer"
                onMouseEnter={() => handleMouseEnter('eiendom')}
                onMouseLeave={handleMouseLeave}
            />
            {hoveredBox === 'eiendom' && (
                <div
                    className="absolute top-0 left-6 bg-white shadow-lg border rounded-lg p-3 w-64 text-sm"
                    onMouseEnter={() => handleMouseEnter('eiendom')}
                    onMouseLeave={handleMouseLeave}
                >
                    Velg eiendommen du vil gjøre en endring på.
                </div>
            )}
        </div>
    </h1>

    <div className='flex flex-col space-y-2 mt-2'>
        <select name="velgEiendom" id="velgEiendom" className='bg-gray-200 border-2 border-gray-300 focus:outline-none focus:ring rounded-md mb-2'>
            <option value="eiendom">Velg eiendom</option>
        </select>

        <h1 className='font-medium'>Eiendomsinformasjon</h1>
        
        <div className="flex flex-col md:flex-row md:gap-8 w-full">
            <div className="flex-1 space-y-2">
                {propertyData.map((field, index) => (
                    <div key={index} className="flex">
                        <p className="font-medium mr-1">{field.label}</p>
                        <span>{field.value}</span>
                    </div>
                ))}
            </div>

            <div className="flex-1 space-y-2">
            <h1 className='font-medium'>Eies av:</h1>
            <div>
              [Fornavn] [Etternavn]
            </div>

    {ownerData.map((field, index) => (
        <div key={index} className="flex">
            <p className="font-medium mr-1">{field.label}</p>
            <span>{field.value}</span>
        </div>
    ))}
            </div>
        </div>
    </div>
</div>

        </div>
      </div>

      <div className="mt-5 w-full flex justify-center gap-4">
      <Button onClick={handleBack} className="border-2 bg-white text-gray-500 border-gray-500 hover:bg-gray-500 hover:text-white w-44">
                    <ArrowLeft className="w-5 h-5 transition-transform duration-300 group-hover: -translate-x-1" />
                    <span className="relative inline-block">Tilbake</span>
                </Button>

      <Button onClick={handleNext} className="border-2 bg-white text-kartAI-blue border-kartAI-blue hover:text-white hover:bg-kartAI-blue w-44">
      <span className="relative inline-block">
            Neste
          </span>
           <ArrowRight size={18} className="ml-2" />    
      </Button>
      </div>
    </div>
  )
}

export default App
