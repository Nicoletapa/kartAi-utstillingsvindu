import React, { useState } from 'react';
import { Info } from 'lucide-react';

interface Step1_0Props {
  formData: {
    size: string;
    material: string;
    ridgeHeight: string;
    eavesHeight: string;
    roofAngle: string;
    distanceToNeighbor: string;
    distanceFromVACables: string;
    distanceFromPowerCables: string;
    description: string;
    planCompliance: string;
    nonComplianceReason: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    size: string;
    material: string;
    ridgeHeight: string;
    eavesHeight: string;
    roofAngle: string;
    distanceToNeighbor: string;
    distanceFromVACables: string;
    distanceFromPowerCables: string;
    description: string;
    planCompliance: string;
    nonComplianceReason: string;
  }>>;
  onValidityChange: (isValid: boolean) => void;
}

const Step1_0: React.FC<Step1_0Props> = ({ formData, setFormData, onValidityChange }) => {
  const [hoveredBox, setHoveredBox] = useState<string | null>(null);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (box: string) => {
    if (timeoutId) clearTimeout(timeoutId);
    setHoveredBox(box);
  };

  const handleMouseLeave = () => {
    const id = setTimeout(() => setHoveredBox(null), 300);
    setTimeoutId(id);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const updatedFormData = { ...formData, [name]: value };
    setFormData(updatedFormData);
    checkFormValidity(updatedFormData);
  };

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updatedFormData = { ...formData, [name]: value };

    if (value === "Nei") {
      updatedFormData.nonComplianceReason = '';
    }

    setFormData(updatedFormData);
    checkFormValidity(updatedFormData);
  };

  const checkFormValidity = (data: typeof formData) => {
    const isValid =
    (data.size?.trim() ?? '') !== '' &&
    (data.material?.trim() ?? '') !== '' &&
    (data.ridgeHeight?.trim() ?? '') !== '' &&
    (data.eavesHeight?.trim() ?? '') !== '' &&
    (data.roofAngle?.trim() ?? '') !== '' &&
    (data.distanceToNeighbor?.trim() ?? '') !== '' &&
    (data.description?.trim() ?? '') !== '' &&
    (data.distanceFromVACables?.trim() ?? '') !== '' &&
    (data.distanceFromPowerCables?.trim() ?? '') !== '' &&
    (data.planCompliance?.trim() ?? '') !== '' &&  
    (data.planCompliance === "Ja" || data.planCompliance === "Nei") &&
    (data.planCompliance === "Ja" || data.nonComplianceReason?.trim() !== '' || true); 
  
  onValidityChange(isValid);
  

  };

  return (
    <div className="justify-center flex flex-col w-full">
      <h1 className="text-3xl font-bold justify-center flex">Hva vil du gjøre på eiendommen din?</h1>

      <h2 className="font-medium mt-4 inline-flex">
        Beskrivelse av tiltaket
        <div className="relative flex">
          <Info
            size={14}
            className="ml-1 hover:cursor-pointer"
            onMouseEnter={() => handleMouseEnter('beskrivelse')}
            onMouseLeave={handleMouseLeave}
          />
          {hoveredBox === 'beskrivelse' && (
            <div
              className="absolute top-0 left-6 bg-white shadow-lg border rounded-lg p-3 w-64 text-sm"
              onMouseEnter={() => handleMouseEnter('beskrivelse')}
              onMouseLeave={handleMouseLeave}
            >
              Her kan du gi en detaljert beskrivelse av tiltaket du planlegger å gjennomføre.
            </div>
          )}
        </div>
      </h2>

      <textarea
        name="description"
        className="w-full min-h-28 mt-2 p-4 text-md border-2 border-gray-400 rounded-lg"
        placeholder="Skriv her ..."
        value={formData.description}
        onChange={handleInputChange}
        required
      />

      <div className="border-2 border-gray-400 rounded-lg mt-4 p-4" data-cy="main-container">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-2/6" data-cy="left-column">
            <h2 className="inline-flex font-medium">
              Bygningdetaljer
              <div className="relative flex">
                <Info
                  size={14}
                  className="ml-1 hover:cursor-pointer"
                  onMouseEnter={() => handleMouseEnter('bygningsdetaljer')}
                  onMouseLeave={handleMouseLeave}
                />
                {hoveredBox === 'bygningsdetaljer' && (
                  <div
                    className="absolute top-0 left-6 bg-white shadow-lg border rounded-lg p-3 w-64 text-sm"
                    onMouseEnter={() => handleMouseEnter('bygningsdetaljer')}
                    onMouseLeave={handleMouseLeave}
                  >
                    Her kan du fylle ut detaljene om bygningen, som størrelse, materiale og avstand til nabogrensen.
                  </div>
                )}
              </div>
            </h2>

            <form className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 mr-1">Størrelse:</label>
                <input
                  type="number"
                  name="size"
                  className="required text-sm w-20 h-8 p-2 border-b-2 border-gray-400 outline-none"
                  value={formData.size}
                  onChange={handleInputChange}
                  required
                />
                <span className="ml-2 text-sm">m²</span>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 mr-1">Materiale:</label>
                <input
                  type="text"
                  name="material"
                  className="text-sm w-36 h-8 p-2 border-b-2 border-gray-400 outline-none"
                  placeholder="F.eks. tre, betong"
                  value={formData.material}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 mr-1">Mønehøyde:</label>
                <input
                  type="number"
                  name="ridgeHeight"
                  className="text-sm w-20 h-8 p-2 border-b-2 border-gray-400 outline-none"
                  value={formData.ridgeHeight}
                  onChange={handleInputChange}
                  required
                />
                <span className="ml-2 text-sm">meter</span>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 mr-1">Gesimshøyde:</label>
                <input
                  type="number"
                  name="eavesHeight"
                  className="text-sm w-20 h-8 p-2 border-b-2 border-gray-400 outline-none"
                  value={formData.eavesHeight}
                  onChange={handleInputChange}
                  required
                />
                <span className="ml-2 text-sm">meter</span>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 mr-1">Takvinkel:</label>
                <input
                  type="number"
                  name="roofAngle"
                  className="text-sm w-20 h-8 p-2 border-b-2 border-gray-400 outline-none"
                  value={formData.roofAngle}
                  onChange={handleInputChange}
                  required
                />
                <span className="ml-2 text-sm">grader</span>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 mr-1">Avstand til nabogrense:</label>
                <input
                  type="number"
                  name="distanceToNeighbor"
                  className="text-sm w-12 h-8 p-2 border-b-2 border-gray-400 outline-none"
                  value={formData.distanceToNeighbor}
                  onChange={handleInputChange}
                  required
                />
                <span className="ml-2 text-sm">meter</span>
              </div>

              <div>
              <label className="text-sm font-medium text-gray-700 mb-1 mr-1">Avstand til VA-ledninger:</label>
                <input
                  type="number"
                  name="distanceFromVACables"
                  className="text-sm w-12 h-8 p-2 border-b-2 border-gray-400 outline-none"
                  value={formData.distanceFromVACables}
                  onChange={handleInputChange}
                  required
                />
                <span className="ml-2 text-sm">meter</span>
              </div>

              <div>
              <label className="text-sm font-medium text-gray-700 mb-1 mr-1">Avstand til strømkabler:</label>
                <input
                  type="number"
                  name="distanceFromPowerCables"
                  className="text-sm w-12 h-8 p-2 border-b-2 border-gray-400 outline-none"
                  value={formData.distanceFromPowerCables}
                  onChange={handleInputChange}
                  required
                />
                <span className="ml-2 text-sm">meter</span>
              </div>
            </form>
          </div>

          <div className="w-full md:w-4/6 md:border-l-2 md:border-gray-400 md:pl-8" data-cy="right-column">
            <h1 className='whitespace-nowrap'>Er tiltaket i tråd med reguleringsplanen/kommuneplan/pbl?</h1>
            <div className='flex flex-col space-y-2 mt-2'>
              <label className='flex items-center'>
                <input 
                type="radio" 
                name="planCompliance"
                value="Ja"
                checked={formData.planCompliance === "Ja"}
                onChange={handleRadioChange}
                className='mr-2'
                />
              Ja
              </label>
              
              <label className='flex items-center'>
                <input 
                type="radio" 
                name="planCompliance"
                value="Nei"
                checked={formData.planCompliance === "Nei"}
                onChange={handleRadioChange}
                className='mr-2'
                />
              Nei
              </label>
            </div>

            {formData.planCompliance === "Nei" && (
              <div className='mt-4'>
                <h1 className="text-md font-medium text-gray mb-2">Du må søke om dispensasjon</h1>
                <p className='text-sm'><b>Dispensasjon</b> er et unntak fra gjeldende regler eller krav som normalt må følges. Det innebærer
                at en myndighet gir tillatelse til å fravike bestemmelser i lover, forskrifter eller reguleringsplaner
                når det fraligger særlige. <br /><br /> Svarene dine vil bli tatt med videre i prosessen, og du vil få 
                muligheten til å søke om dispensasjon i de neste stegene.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step1_0;