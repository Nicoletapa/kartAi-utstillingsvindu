import React, { useState } from 'react'
import { Info } from 'lucide-react';

const BruksendreStep6_0 = () => {
  const [openModal, setOpenModal] = useState<boolean>(false);

  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => setOpenModal(false);

  return (
    <div className="mb-52 flex flex-col mx-auto px-4 w-full max-w-4xl">
      <h1 className="text-3xl font-bold justify-center flex text-center items-center">Hva må du gjøre videre?
        <Info size={18} className="ml-2 hover:cursor-pointer inline-block mb-8" onClick={handleOpenModal} />
      </h1>
      {openModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" onClick={handleCloseModal}>
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full transform transition-all scale-95 opacity-0 animate-fadeIn"
            onClick={(e) => e.stopPropagation()}>
            <div className="mb-8">
              <h1 className="text-xl font-medium">Om Søknadsresultatet</h1>
              <p className="text-sm mt-2">
              Behandlingstiden på søknader kan variere, men standard behandlingstid er fra 8-12 uker. <br /><br />
              Søknaden vil gå gjennom 5 faser til du får resultatet:
              </p>
            </div>

            <button className="absolute mt-4 px-4 py-2 right-3 bottom-3 bg-gray-400 text-white rounded hover:bg-gray-500 transition"
              onClick={handleCloseModal}>
              Lukk
            </button>
          </div>
        </div>
      )}

      <div className='mt-6'>
        <p>Før du skal ta bygget i bruk, må du enten:</p>
          <ul className='list-disc ml-7 space-y-1'>
            <li><span className='font-medium'>Midlertidig tillatelse</span> - hvis bygget ikke er helt ferdig, men kan brukes med noen begrensniner.</li>
            <li><span className='font-medium'>Ferdigattest</span> - når alt er fullført i henhold til søknaden.</li>
          </ul>

          <p className='font-bold mt-6'>For å få ferdigattest:</p>
          <ul className='list-disc ml-7 space-y-1'>
            <li>Dokumentasjon på at alle krav er fulgt sendes til kommunen.</li>
            <li>Kontroller at alt arbeid er utført i henhold til tillatelsen.</li>
          </ul>
      </div>

      <div className='border-4 border-blue-800 bg-blue-100 p-4 rounded-lg mt-4'>
        <h1 className='font-bold'>Viktig å huske!</h1>
        <ul className='list-disc font-medium pl-7 space-y-1'>
          <li>Byggearbeidet må starte innen 3 år og være ferdig innen 5 år fra vedtaket, ellers må du søke på nytt.</li>
          <li>Dersom det skjer endringer underveis i prosjektet, må du melde fra til kommunen og eventuelt søke om endringstillatelse.</li>
          <li>Forsikre deg om at du har alle nødvendige godkjenninger før du begynner å bruke bygget.</li>
        </ul>
      </div>
    </div>  
  )
}

export default BruksendreStep6_0
