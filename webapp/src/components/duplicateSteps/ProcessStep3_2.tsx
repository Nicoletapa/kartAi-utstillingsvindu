import React, { useCallback, useState, useRef } from 'react'
import Countdown from 'react-countdown'
import { Info, Upload, X } from 'lucide-react'
import { useDropzone } from 'react-dropzone'


const ProcessStep3_2 = () => {
    
    const targetDate = useRef(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [openModal, setOpenModal] = useState<boolean>(false);

    const handleOpenModal = () => setOpenModal(true);
    const handleCloseModal = () => setOpenModal(false);

    const renderer = ({ days, hours, minutes, seconds, completed }: { days: number, hours: number, minutes: number, seconds: number, completed: boolean }) => {
            if (completed) {
                return <span>Tiden er ute!</span>
            } else {
                return (
                    <span>
                        {days}d {hours}t {minutes}m {seconds}s
                    </span>
                );
            }
        };
    
        const onDrop = useCallback((acceptedFiles: File[]) => {
                setUploadedFiles((prev) => [...prev, ...acceptedFiles]);
        }, []);
    
        const removeFile = (index: number) => {
            setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
        };
    
        const { getRootProps, getInputProps, isDragActive } = useDropzone({
            onDrop,
            accept: {
                "image/*": [".png", ".jpg", ".jpeg", ".tiff", ".bmp"],
                "application/pdf": [".pdf"],
                "application/dwg": [".dwg"],
                "application/dxf": [".dxf"],
            },
            multiple: true,
        });

  return (
      <div className="justify-center flex lg:pl-52 md:pl-20">
          <div className="w-full max-w-4xl">
              <h1 className="text-3xl font-bold justify-center flex">Vent på merknader
                  <Info size={18} className="ml-2 hover:cursor-pointer" onClick={handleOpenModal} />
              </h1>
              {openModal && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" onClick={handleCloseModal}>
                      <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full transform transition-all scale-95 opacity-0 animate-fadeIn"
                          onClick={(e) => e.stopPropagation()}>
                          <div className="mb-8">
                              <h1 className="text-xl font-medium">Hva er Merknader?</h1>
                              <p className="text-sm mt-2">
                                  Når naboene mottar nabovarselet, har de en frist på 14 dager til å komme med merknader.
                                  En merknad er en skriftlig tilbakemenlding der naboen uttrykker eventuelle bekymringer
                                  eller innsigelser til det planlagte tiltaket. <br />
                                  Du vil få varsel på e-post dersom det har blitt sendt inn digitaler merknader.
                              </p>
                          </div>

                          <button className="absolute mt-4 px-4 py-2 right-3 bottom-3 bg-gray-400 text-white rounded hover:bg-gray-500 transition"
                              onClick={handleCloseModal}>
                              Lukk
                          </button>
                      </div>
                  </div>
              )}

              <div className="font-medium mt-6 w-96 px-2 py-2 bg-kartAI-blue text-white items-center justify-center flex rounded-sm">
                  <p>Tid gjenstående: <Countdown date={targetDate.current} renderer={renderer} /> </p>
              </div>

              <div className="flex flex-col gap-6 w-96 max-w-4xl mt-10">
                  <div className="min-h-32 min-w-24 px-4 py-4 rounded-sm shadow-md">
                      <h1 className="font-medium">Digitale innsendte merknader:</h1>
                      <div className="text-gray-400 mt-2">
                          Ingen merknader
                      </div>
                  </div>

                  <div>
                      <p className="mb-1"><b>OBS!</b> Om naboen sendte noen merknader i posten, vennligst last de opp her: </p>
                      <div {...getRootProps()}
                          className={`h-12 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed mb-4 transition-colors ${isDragActive ? "bg-gray-300 border-gray-400" : "bg-gray-100 hover:bg-gray-100"}`}
                      >
                          <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
                              <input {...getInputProps()} className="hidden" multiple />
                              <span className="text-sm text-gray-500 inline-flex">
                                  {isDragActive ? "Slipp filene her" : "Dra og slipp filer eller klikk for å laste opp"}
                                  <Upload size={18} className="text-gray-500 ml-2" />
                              </span>
                          </label>

                      </div>
                      {uploadedFiles.length > 0 && (
                          <div className="mt-4 p-2 bg-gray-200 rounded">
                              <h2 className="font-medium">Opplastede filer:</h2>
                              <ul className="text-sm">
                                  {uploadedFiles.map((file, index) => (
                                      <li key={index} className="mt-1">{file.name}
                                          <button className="ml-4 text-red-500 hover:text-red-700 transition" onClick={() => removeFile(index)}>
                                              <X size={16} />
                                          </button>
                                      </li>
                                  ))}
                              </ul>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      </div>
  )
}

export default ProcessStep3_2
