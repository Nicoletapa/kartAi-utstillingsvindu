import { Info } from 'lucide-react';
import React, { useState } from 'react';

const Step3_0 = () => {
  const [openModal, setOpenModal] = useState<boolean>(false);

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
  );
};

export default Step3_0;