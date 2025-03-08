import React, { useState } from 'react';
import { Info } from 'lucide-react';

const Step1_0 = () => {

  const [hoveredBox, setHoveredBox] = useState<string | null>(null);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (box: string) => {
    if (timeoutId) clearTimeout(timeoutId);
    setHoveredBox(box);
  }

  const handleMouseLeave = () => {
    const id = setTimeout(() => setHoveredBox(null), 300);
    setTimeoutId(id);
  };

  return (
    <div className="md:px-10">
      <h1 className='text-3xl font-bold justify-center flex'>Hva vil du gjøre på eiendommen din?</h1>

      <h2 className='font-medium mt-4 inline-flex'>Beskrivelse av tiltaket
        <div className="relative flex">
        <Info size={14} 
        className='ml-1 hover:cursor-pointer'
        onMouseEnter={() => handleMouseEnter("beskrivelse")}
        onMouseLeave={handleMouseLeave}
        />
        {hoveredBox === "beskrivelse" && (
          <div
          className="absolute top-0 left-6 bg-white shadow-lg border rounded-lg p-3 w-64 text-sm"
          onMouseEnter={() => handleMouseEnter("beskrivelse")}
          onMouseLeave={handleMouseLeave}
          >
          Her kan du gi en detaljert beskrivelse av tiltaket du planlegger å gjennomføre.
          </div>
        )}
        </div>
      </h2>

      <textarea className='w-full min-h-28 mt-2 p-4 text-md border-2 border-gray-400 rounded-lg' placeholder='Skriv her ...' />
      
      <div className='border-2 border-gray-400 rounded-lg mt-4 p-4' data-cy='main-container'>
        <div className='flex flex-col md:flex-row gap-8'>

        <div className='w-full md:w-2/6' data-cy='left-column'>
          <h2 className='inline-flex font-medium'>Bygningdetaljer
            <div className="relative flex">
            <Info size={14} 
            className='ml-1 hover:cursor-pointer'
            onMouseEnter={() => handleMouseEnter("bygningsdetaljer")}
            onMouseLeave={handleMouseLeave}
            />

          {hoveredBox === "bygningsdetaljer" && (
          <div
          className="absolute top-0 left-6 bg-white shadow-lg border rounded-lg p-3 w-64 text-sm"
          onMouseEnter={() => handleMouseEnter("bygningsdetaljer")}
          onMouseLeave={handleMouseLeave}
          >
            Her kan du fylle ut detaljene om bygningen, som størrelse, materiale og avstand til nabogrensen.
          </div>
        )}
          </div>
          </h2>
          
          <form className="space-y-4 mt-4">
            <div className="">
              <label className="text-sm font-medium text-gray-700 mb-1 mr-1">
                Størrelse:
              </label>
              <input
                type="number"
                className=" text-sm w-20 h-8 p-2 border-b-2 border-gray-400 outline-none"
              />
              <span className='ml-2 text-sm'>m²</span>
            </div>

            <div className="">
              <label className="text-sm font-medium text-gray-700 mb-1 mr-1">
                Materiale:
              </label>
              <input
                type="text"
                className="text-sm w-36 h-8 p-2 border-b-2 border-gray-400 outline-none"
                placeholder="F.eks. tre, betong"
              />
            </div>

            <div className="">
              <label className="text-sm font-medium text-gray-700 mb-1 mr-1">
                Høyde:
              </label>
              <input
                type="number"
                className="text-sm w-20 h-8 p-2 border-b-2 border-gray-400 outline-none"
              />
              <span className='ml-2 text-sm'>meter</span>
            </div>

            <div className="">
              <label className="text-sm font-medium text-gray-700 mb-1 mr-1">
                Takvinkel:
              </label>
              <input
                type="number"
                className="text-sm w-20 h-8 p-2 border-b-2 border-gray-400 outline-none"
              />
              <span className='ml-2 text-sm'>grader</span>
            </div>

            <div className="">
              <label className="text-sm font-medium text-gray-700 mb-1 mr-1">
                Avstand til nabogrense:
              </label>
              <input
                type="number"
                className="text-sm w-20 h-8 p-2 border-b-2 border-gray-400 outline-none"
              />
              <span className='ml-2 text-sm'>meter</span>
            </div>
          </form>
        </div>

        <div className="w-full md:w-4/6 md:border-l-2 md:border-gray-400 md:pl-8"  data-cy='right-column'>
          <p>
            Tiltaket er i samsvar med gjeldene regularingsplan og vil/vil ikke medføre vesentlige endringer
            for nabolaget. Det vil påvirke eksisterende bebyggelse og miljø ved
          </p>
          <input
            type="text"
            className="text-sm w-full h-8 p-2 mb-1 border-b-2 border-gray-400 outline-none"
            placeholder="F.eks å gi bedre parkeringsmuligheter uten å forstyrre omkringliggende strukturer"
          />
          <span >(Begrunnelse)</span>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Step1_0;