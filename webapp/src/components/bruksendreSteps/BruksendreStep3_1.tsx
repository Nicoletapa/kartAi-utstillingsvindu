import React, { useState } from 'react';
import { Info } from 'lucide-react';
import Nabovarsel from '../Nabovarsel';
import { ApplicationService, UIComponents } from '~/utils/api-service';


interface BruksendreStep3_1Props {
  applicationID: number;
}

const BruksendreStep3_1: React.FC<BruksendreStep3_1Props> = ({ applicationID }) => {
    const [openModal, setOpenModal] = useState<boolean>(false);
    const { saveField, isSaving } = ApplicationService.useSaveFormData(applicationID, 'sma-prosjekter');

    const handleOpenModal = () => setOpenModal(true);
    const handleCloseModal = () => setOpenModal(false);
    saveField('progress.currentStep', '3_1');


  return (
    <div className="justify-center flex md:pl-10">
      <div className="w-full max-w-4xl">
      <h1 className="text-3xl font-bold justify-center flex">Nabovarsel
        <Info size={18} className="ml-2 hover:cursor-pointer" onClick={handleOpenModal}/>
      </h1>
      {openModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" onClick={handleCloseModal}>
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full transform transition-all scale-95 opacity-0 animate-fadeIn"
            onClick={(e) => e.stopPropagation()}>
              <div className="mb-8">
                <h1 className="text-xl font-medium">Sending av Nabovarsel</h1>
                <p className="text-sm mt-2">
                  Nabovarselen vil sendes til berørende naboer via e-post. I nabovarselen vil følgende bli beskrevet:
                </p>
                <ul className='list-disc ml-7 text-sm mt-2'>
                  <li>Beskrivelse av tiltaket</li>
                  <li>Henvisning til plan- og bygningsloven</li>
                  <li>Frist for merknader</li>
                  <li>Tegninger og situasjonskart</li>
                  <li>Kontaktinformasjon til tilhaver</li>
                </ul>
              </div>

              <button className="absolute mt-4 px-4 py-2 right-3 bottom-3 bg-gray-400 text-white rounded hover:bg-gray-500 transition"
              onClick={handleCloseModal}>
                Lukk
              </button>
            </div>
          </div>
        )}

      <div>
        <Nabovarsel />
      </div>
    </div>
    </div>
    
  );
};

export default BruksendreStep3_1;