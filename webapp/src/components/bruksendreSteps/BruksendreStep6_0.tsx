import React, { useState } from 'react'
import { Info } from 'lucide-react';
import { ApplicationService, UIComponents } from '~/utils/api-service';


interface BruksendreStep6_0Props {
  applicationID: number;
}

const BruksendreStep6_0: React.FC<BruksendreStep6_0Props> = ({ applicationID }) => {
  const [openModal, setOpenModal] = useState<boolean>(false);
  const { saveField, isSaving } = ApplicationService.useSaveFormData(applicationID, 'sma-prosjekter');
  

  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => setOpenModal(false);

  return (
    <div className="mb-40 flex flex-col items-center justify-center min-h-screen mx-auto px-4 w-full max-w-4xl">
      <div className="w-full flex flex-col items-center">
        <h1 className="text-3xl font-bold flex items-center justify-center">
          Hva må du gjøre videre?
          <Info 
            size={18} 
            className="ml-2 hover:cursor-pointer inline-block mb-8" 
            onClick={handleOpenModal} 
          />
        </h1>

        {openModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
            onClick={handleCloseModal}
          >
            <div
              className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full mx-4 transform transition-all scale-95 opacity-0 animate-fadeIn"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-8">
                <h1 className="text-xl font-medium text-center">Hva må du gjøre videre?</h1>
                <p className="text-sm mt-2 text-center">
                  Behandlingstiden på søknader kan variere, men standard behandlingstid er fra 8-12 uker.
                  <br />
                  <br />
                  Søknaden vil gå gjennom 5 faser til du får resultatet:
                </p>
              </div>

              <div className="flex justify-center">
                <button
                  className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition"
                  onClick={handleCloseModal}
                >
                  Lukk
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 w-full max-w-2xl">
          <p className="text-center">Før du skal ta bygget i bruk, må du enten:</p>
          <ul className="list-disc space-y-1 mx-auto max-w-md pl-5">
            <li className="text-left">
              <span className="font-medium">Midlertidig tillatelse</span> - hvis bygget ikke er helt ferdig, men kan brukes med noen begrensninger.
            </li>
            <li className="text-left">
              <span className="font-medium">Ferdigattest</span> - når alt er fullført i henhold til søknaden.
            </li>
          </ul>

          <p className="font-bold mt-6 text-center">For å få ferdigattest:</p>
          <ul className="list-disc space-y-1 mx-auto max-w-md pl-5">
            <li className="text-left">Dokumentasjon på at alle krav er fulgt sendes til kommunen.</li>
            <li className="text-left">Kontroller at alt arbeid er utført i henhold til tillatelsen.</li>
          </ul>
        </div>

        <div className="border-4 border-blue-800 bg-blue-100 p-4 rounded-lg mt-4 w-full max-w-2xl">
          <h1 className="font-bold text-center">Viktig å huske!</h1>
          <ul className="list-disc space-y-1 pl-5">
            <li className="text-left">Byggearbeidet må starte innen 3 år og være ferdig innen 5 år fra vedtaket, ellers må du søke på nytt.</li>
            <li className="text-left">Dersom det skjer endringer underveis i prosjektet, må du melde fra til kommunen og eventuelt søke om endringstillatelse.</li>
            <li className="text-left">Forsikre deg om at du har alle nødvendige godkjenninger før du begynner å bruke bygget.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default BruksendreStep6_0