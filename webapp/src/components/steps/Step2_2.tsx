import React, { useState } from 'react'
import { Info } from 'lucide-react'
import Dispensasjon from '../Dispensasjon';
import { ApplicationService } from '~/utils/api-service';


interface Step2_2Props {
  applicationID: number;
}

const Step2_2: React.FC<Step2_2Props> = ({ applicationID }) => {
    const [openModal, setOpenModal] = useState<boolean>(false);
    const { saveField, isSaving } = ApplicationService.useSaveFormData(applicationID, 'sma-prosjekter');
    
            
    const handleOpenModal = () => setOpenModal(true);
    const handleCloseModal = () => setOpenModal(false);

    void saveField('progress.currentStep', '2_2');
  return (
    <div>
      <h1 className="text-3xl font-bold justify-center flex">Søknad om Dispensasjon
        <Info size={18} className="ml-2 hover:cursor-pointer" onClick={handleOpenModal} />
      </h1>
      {openModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" onClick={handleCloseModal}>
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full transform transition-all scale-95 opacity-0 animate-fadeIn"
            onClick={(e) => e.stopPropagation()}>
            <div className="mb-8">
              <h1 className="text-xl font-medium">Andre vedlegg</h1>
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
      <Dispensasjon
        application={{ applicationID }}
        user={{
          email: 'example@example.com',
          address: '123 Example Street',
          name: 'John Doe',
          gnr: 1,
          bnr: 2,
        }}
      /> 
    </div>

    
  )
}

export default Step2_2
