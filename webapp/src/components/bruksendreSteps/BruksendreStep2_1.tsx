import React, { useState } from 'react'
import { Info } from 'lucide-react'
import { ApplicationService, UIComponents } from '~/utils/api-service';

interface BruksendreStep2_1Props {
  applicationID: number;
}

const BruksendreStep2_1: React.FC<BruksendreStep2_1Props> = ({ applicationID }) => {
    const [openModal, setOpenModal] = useState<boolean>(false);
    const { saveField, isSaving } = ApplicationService.useSaveFormData(applicationID, 'sma-prosjekter');
    
        
    const handleOpenModal = () => setOpenModal(true);
    const handleCloseModal = () => setOpenModal(false);

  return (
    <div className='relative lg:pl-32 max-w-3xl'>
      <h1 className="text-3xl font-bold justify-center flex">Dispensasjon
        <Info size={18} className="ml-2 hover:cursor-pointer" onClick={handleOpenModal} />
      </h1>
      {openModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" onClick={handleCloseModal}>
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full transform transition-all scale-95 opacity-0 animate-fadeIn"
            onClick={(e) => e.stopPropagation()}>
            <div className="mb-8">
              <h1 className="text-xl font-medium">Om Dispensasjon</h1>
              <p className="text-sm mt-2">
                Byggesøknaden har blitt generert og fylt ut basert på informasjonen du har oppgitt.
                Dobbelsjekk at all informasjon og detaljer er korrekte før du sender inn søknaden.
              </p>
            </div>

            <button className="absolute mt-4 px-4 py-2 right-3 bottom-3 bg-gray-400 text-white rounded hover:bg-gray-500 transition"
              onClick={handleCloseModal}>
              Lukk
            </button>
          </div>
        </div>
      )}
      <h1 className='font-bold mt-4 justify-center flex'>Basert på informasjonen du har gitt så behøver du å søke om dispensasjon.</h1>

      <div className='border-4 rounded-lg border-blue-800 mt-4 p-4'>
          <h1 className='font-bold'>Hva er dispensasjon?</h1>
          <p><b>Dispensasjon</b> er et unntak fra gjeldende regler eller krav som normalt må følges. Det innebærer
          at en myndighet gir tillatelse til å fravike bestemmelser i lover, forskrifter eller reguleringsplaner
          når det fraligger særlige grunner.</p>
      </div>

      <div className='border-4 rounded-lg border-blue-800 mt-4 p-4'>
          <h1 className='font-bold'>Hva må du gjøre?</h1>
          <p>Du vil bli ført til dispensasjonssøknaden ved å trykke på knappen <b>"Søk om dispensasjon"</b> </p>
      </div>

      <button className="w-full my-3 py-2 border-2 border-kartAI-blue rounded-lg text-kartAI-blue hover:bg-kartAI-blue hover:text-white duration-300">
        Søk om dispensasjon
      </button>
    </div>
  )
}

export default BruksendreStep2_1
