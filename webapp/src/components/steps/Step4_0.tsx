import React, { useState } from 'react'
import { Info } from 'lucide-react';
import AndreVedlegg from '../AndreVedlegg';

const Step4_0 = () => {
    const [openModal, setOpenModal] = useState<boolean>(false);
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
                
        const handleOpenModal = () => setOpenModal(true);
        const handleCloseModal = () => setOpenModal(false);

        const handleFileUpload = (files: File[]) => {
          console.log('Files uploaded:', files);
          setUploadedFiles((prev) => [...prev, ...files]);
         
        };
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
       <AndreVedlegg documents={[]} onUpload={handleFileUpload} />
    </div>

   
  )
}

export default Step4_0
