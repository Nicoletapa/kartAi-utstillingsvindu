import React, { useState } from 'react';
import { Info } from 'lucide-react';
import Nabovarsel from '../Nabovarsel';


const Step3_1 = () => {
    const [openModal, setOpenModal] = useState<boolean>(false);
    
    const handleOpenModal = () => setOpenModal(true);
    const handleCloseModal = () => setOpenModal(false);

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
                  Dokumentsjekk er et verktøy som lar deg laste opp dokumenter for å sjekke om de inneholder nødvendige tegninger for byggesøknad ved hjelp av kunstig intelligens.
                  <br />Du kan laste opp dokumenter i formatene PDF, DWG, DXF, PNG, JPG, JPEG, TIFF og BMP.
                  <br />Validerte dokumenter vil bli lagret i din bruker for fremtidig bruk. Ugyldige opplastede dokumenter vil bli slettet.
                </p>
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

export default Step3_1;