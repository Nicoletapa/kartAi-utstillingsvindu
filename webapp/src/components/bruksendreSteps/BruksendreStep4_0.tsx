import React, { useState } from 'react'
import { Info } from 'lucide-react';
import AndreVedlegg from '../AndreVedlegg';
import { ApplicationService, UIComponents } from '~/utils/api-service';


interface BruksendreStep4_0Props {
  applicationID: number;
}

const BruksendreStep4_0: React.FC<BruksendreStep4_0Props> = ({ applicationID }) => {
    const [openModal, setOpenModal] = useState<boolean>(false);
    const { saveField, isSaving } = ApplicationService.useSaveFormData(applicationID, 'sma-prosjekter');
    
                
        const handleOpenModal = () => setOpenModal(true);
        const handleCloseModal = () => setOpenModal(false);

        saveField('progress.currentStep', '4_0');

  return (
    <div>
        <h1 className="text-3xl font-bold justify-center flex mb-4">Andre vedlegg
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
       <AndreVedlegg documents={[]} onUpload={() => {}} />
    </div>

   
  )
}

export default BruksendreStep4_0
