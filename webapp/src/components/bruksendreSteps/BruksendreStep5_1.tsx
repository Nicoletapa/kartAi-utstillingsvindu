import React, { useState } from 'react'
import { Info } from 'lucide-react';
import { Button } from '../ui/button';
import { ApplicationService, UIComponents } from '~/utils/api-service';


interface BruksendreStep5_1Props {
  applicationID: number;
}

const BruksendreStep5_1: React.FC<BruksendreStep5_1Props> = ({ applicationID }) => {
  const [openModal, setOpenModal] = useState<boolean>(false);
  const { saveField, isSaving } = ApplicationService.useSaveFormData(applicationID, 'sma-prosjekter');
  

  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => setOpenModal(false);

  return (
    <div className="md:pl-20 mb-52">
      <h1 className="text-3xl font-bold justify-center flex">Byggesøknaden er godkjent
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
            </div>

            <button className="absolute mt-4 px-4 py-2 right-3 bottom-3 bg-gray-400 text-white rounded hover:bg-gray-500 transition"
              onClick={handleCloseModal}>
              Lukk
            </button>
          </div>
        </div>
      )}

      <div className='mt-6 w-full' data-cy="main-container">
        <div className="flex flex-col md:flex-row">
<div className='w-full md:w-2/4' data-cy="left-column">
            <p className='font-medium'>Når en byggesøknad er godkjent, kan du som tiltakshaver eller ansvarlig søker gå videre med byggeprosjektet.
                Du har fått igangsettingstillatelse (IG).
            </p><br />
            <p className='font-medium'>Dette betyr at du nå har lov til å starte bygningen i henhold til godkjent søknad.</p>
        </div>
        <div className='w-full md:w-2/4 md:pl-6' data-cy="right-column">
            <div className='rounded-lg p-4 border-4 border-blue-800 flex flex-col items-center'>
                <p className='text-center'>Hva du kan gjøre avhenger av hvilken type tillatelse du har fått:</p>
                <Button className='mt-4 bg-white border-kartAI-blue border-2 text-kartAI-blue hover:bg-kartAI-blue hover:text-white'>
                    Les mer
                </Button>
            </div>
        </div>
        </div>
        
      </div>
      <h1 className='font-bold mt-6'>Neste steg:</h1>
      <ul className='list-disc'>
        <li><span className='font-medium'>Starte byggearbeidet</span> i henhold til godkjente tegninger og krav.</li>
        <li>Følge kravene til <span className='font-medium'>tilsyn og kontroll</span> (dersom tiltaket er søknadspliktig).</li>
        <li>Sørge for at ansvarlige foretak følger regler og fører nødvendige kontroller.</li>
      </ul>
    </div>  
  )
}

export default BruksendreStep5_1
