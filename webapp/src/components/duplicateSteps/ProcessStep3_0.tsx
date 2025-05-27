import React, { useState } from 'react'
import { Info } from 'lucide-react';

interface ProcessStep3_0Props { 
  applicationID: number;
}

const ProcessStep3_0:React.FC<ProcessStep3_0Props> = ({applicationID}) => {
      const [openModal, setOpenModal] = useState<boolean>(false);
     console.log("Application ID in ProcessStep3_0:", applicationID);

      const handleOpenModal = () => setOpenModal(true);
      const handleCloseModal = () => setOpenModal(false);

  return (
    <div className="justify-center flex md:pl-32">
          <div className="w-full max-w-4xl">
            <h1 className="text-3xl font-bold flex justify-center">Nabovarsel
              <Info size={18} className="ml-2 hover:cursor-pointer" onClick={handleOpenModal} />
            </h1>
            {openModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" onClick={handleCloseModal}>
                <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full transform transition-all scale-95 opacity-0 animate-fadeIn"
                  onClick={(e) => e.stopPropagation()}>
                  <div className="mb-8">
                    <h1 className="text-xl font-medium">Hva er Nabovarsel?</h1>
                    <p className="text-sm mt-2">
                      Et nabovarsel er en melding du sender til naboene dine når du planlegger et byggeprosjekt som kan påvirke dem.
                      Dette kan være alt fra å bygge en garasje, tilbygg, eller endringer av eksisterende bygg.
                      <br /><br />Når du sender en nabovarsel, gis en frist på 14 dager til naboene for å komme med
                      eventuelle merknader. Deretter kan du sende søknaden til kommunen sammen med dokumentasjon på at naboene er varslet.
                    </p>
                  </div>
    
                  <button className="absolute mt-4 px-4 py-2 right-3 bottom-3 bg-gray-400 text-white rounded hover:bg-gray-500 transition"
                    onClick={handleCloseModal}>
                    Lukk
                  </button>
                </div>
              </div>
            )}
    
            <div className="mt-6">
              <h2 className="font-medium">Naboliste</h2>
              <p>Automatisk forslag til naboer. Ta bort og legg til naboer ved å klikke på kartet.</p>
              <button className="w-full my-3 py-2 border-2 border-kartAI-blue rounded-lg text-kartAI-blue hover:bg-kartAI-blue hover:text-white duration-300">
                Generer nabovarsel
              </button>
    
              <div className="w-full h-80 bg-gray-200">
                <p>kart</p>
              </div>
              <button className="w-full my-3 py-2 border-2 border-kartAI-blue rounded-lg text-kartAI-blue hover:bg-kartAI-blue hover:text-white duration-300">
                Last ned
              </button>
            </div>
    
          </div>
        </div>
  )
}

export default ProcessStep3_0
