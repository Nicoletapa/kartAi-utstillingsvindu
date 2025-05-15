import React, { useState } from 'react'
import { Info } from 'lucide-react';

const ProcessStep5_0 = () => {
      const [openModal, setOpenModal] = useState<boolean>(false);
      const [status, setStatus] = useState<string | null>(null);
    
      const handleOpenModal = () => setOpenModal(true);
      const handleCloseModal = () => setOpenModal(false);
    
      const handleCheckStatus = () => {
        setStatus("Søknaden din er under behandling.");
      }
  return (
    <div className="lg:pl-52 md:pl-20 mb-52">
          <h1 className="text-3xl font-bold justify-center flex">Vent på søknadsresultatet
            <Info size={18} className="ml-2 hover:cursor-pointer" onClick={handleOpenModal} />
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
                  <ul className='list-decimal text-sm ml-7'>
                    <li>Mottak og registrering</li>
                    <li>Saksbehandling og vurdering</li>
                    <li>Høring og uttalelser</li>
                    <li>Vedtak fattes</li>
                    <li>Klagefrist og endelig avgjørelse</li>
                  </ul>
                  <p className='font-medium text-sm mt-4'>Søknadstiden starter når søknaden er komplett. Kommunen har frister som de forholder seg til.
              <br /> Vanlige frister:
            </p>
            <ul className='list-disc ml-7 text-sm'>
              <li>3 Ukers tidsfrist hvis søknaden ikke inneholder dispensasjon og nabomerknader.</li>
              <li>12 ukers tidsfrist hvis søknaden inneholder dispensasjon og/eller nabomerknader.</li>
            </ul>
            <p className='font-medium text-sm'>Du vil motta &quot;varsel om saksoppdatering&quot; når det forekommer endring i byggesøknaden din.</p>
                </div>
    
                <button className="absolute mt-4 px-4 py-2 right-3 bottom-3 bg-gray-400 text-white rounded hover:bg-gray-500 transition"
                  onClick={handleCloseModal}>
                  Lukk
                </button>
              </div>
            </div>
          )}
    
          <div className="flex justify-center mt-8">
            <button onClick={handleCheckStatus} className="w-96 my-3 py-2 border-2 border-kartAI-blue rounded-lg text-kartAI-blue hover:bg-kartAI-blue hover:text-white duration-300">
              Sjekk status på søknaden
            </button>
          </div>
          <p className='justify-center flex'><span className='font-medium'>Estimert behandlingstid: </span>&nbsp;8-12 uker</p>
          {status && (
            <div className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 border rounded w-96 text-center">
              {status}
            </div>
          )}
          
        </div>
  )
}

export default ProcessStep5_0
