import React, { useState } from 'react';
import { Info } from 'lucide-react';

interface Step1_0Props {
  formData: {
    size: string;
    ridgeHeight: string;
    eavesHeight: string;
    distanceToNeighbor: string;
    distanceFromVACables: string;
    distanceFromPowerCables: string;
    distanceFromRoad: string;
    distanceFromTracks: string;
    calculationMethod: string;
    buildingDensity: string;
    driveway: string;
    drivewayChanges: string;
    noDrivewayChanges: string;
    planCompliance: string;
    nonComplianceReason: string;
    nationalRoadOrCountyRoad: boolean;
    communalRoad: boolean;
    privateRoad: boolean;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    size: string;
    ridgeHeight: string;
    eavesHeight: string;
    distanceToNeighbor: string;
    distanceFromVACables: string;
    distanceFromPowerCables: string;
    distanceFromRoad: string;
    distanceFromTracks: string;
    calculationMethod: string;
    buildingDensity: string;
    driveway: string;
    drivewayChanges: string;
    noDrivewayChanges: string;
    planCompliance: string;
    nonComplianceReason: string;
    nationalRoadOrCountyRoad: boolean;
    communalRoad: boolean;
    privateRoad: boolean;
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

    if (value === "Ja") {
      updatedFormData.noDrivewayChanges = '';
    }

    setFormData(updatedFormData);
    checkFormValidity(updatedFormData);
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    const updatedFormData = { 
      ...formData, 
      [name]: checked 
    };
    setFormData(updatedFormData);
    checkFormValidity(updatedFormData);
  };

  const checkFormValidity = (data: typeof formData) => {
    const basicFieldsValid = 
      (data.size?.trim() ?? '') !== '' &&
      (data.ridgeHeight?.trim() ?? '') !== '' &&
      (data.eavesHeight?.trim() ?? '') !== '' &&
      (data.distanceToNeighbor?.trim() ?? '') !== '' &&
      (data.calculationMethod?.trim() ?? '') !== '' &&
      (data.buildingDensity?.trim() ?? '') !== '' &&
      (data.distanceFromVACables?.trim() ?? '') !== '' &&
      (data.distanceFromPowerCables?.trim() ?? '') !== '' &&
      (data.distanceFromRoad?.trim() ?? '') !== '' &&
      (data.distanceFromTracks?.trim() ?? '') !== '' &&
      (data.drivewayChanges === "Ja" || data.drivewayChanges === "Nei") &&
      (data.planCompliance === "Ja" || data.planCompliance === "Nei") &&
      (data.planCompliance !== "Nei" || (data.nonComplianceReason?.trim() ?? '') !== '');
  
    const drivewayValid = data.drivewayChanges === "Nei" || 
                        (data.nationalRoadOrCountyRoad || 
                         data.communalRoad || 
                         data.privateRoad);
  
    const isValid = basicFieldsValid && drivewayValid;
    onValidityChange(isValid);
  };

  return (
    <div className="justify-center flex flex-col w-full">
      <h1 className="text-3xl font-bold justify-center flex">Detaljer til det du vil gjøre</h1>

      <h2 className="font-medium mt-4 inline-flex">
        Beregningsmåte
        <div className="relative flex">
          <Info
            size={14}
            className="ml-1 hover:cursor-pointer"
            onMouseEnter={() => handleMouseEnter('calculationMethod')}
            onMouseLeave={handleMouseLeave}
          />
          {hoveredBox === 'calculationMethod' && (
            <div
              className="absolute top-0 left-6 bg-white shadow-lg border rounded-lg p-3 w-64 text-sm"
              onMouseEnter={() => handleMouseEnter('calculationMethod')}
              onMouseLeave={handleMouseLeave}
            >
            Beregningsmetode i en byggesøknad er måten arealer og volumer beregnes på for å sikre at prosjektet overholder gjeldende lover og forskrifter.
            </div>
          )}
        </div>
      </h2>

      <textarea
        name="calculationMethod"
        className="w-full min-h-28 mt-2 p-4 text-md border-2 border-gray-400 rounded-lg"
        placeholder="Skriv her ..."
        value={formData.calculationMethod}
        onChange={handleInputChange}
        required
      />

      <div className="border-2 border-gray-400 rounded-lg mt-4 p-4" data-cy="main-container">
        <div className="flex flex-col md:flex-row">
          <div className="w-full md:w-3/6" data-cy="left-column">
            <h2 className="inline-flex font-medium">
              Bygningdetaljer
              <div className="relative flex">
                <Info
                  size={14}
                  className="ml-1 hover:cursor-pointer"
                  onMouseEnter={() => handleMouseEnter('buildingDetails')}
                  onMouseLeave={handleMouseLeave}
                />
                {hoveredBox === 'buildingDetails' && (
                  <div
                    className="absolute top-0 left-6 bg-white shadow-lg border rounded-lg p-3 w-64 text-sm"
                    onMouseEnter={() => handleMouseEnter('buildingDetails')}
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

              <div>
              <label className="text-sm font-medium text-gray-700 mb-1 mr-1">Avstand til vei:</label>
                <input
                  type="number"
                  name="distanceFromRoad"
                  className="text-sm w-12 h-8 p-2 border-b-2 border-gray-400 outline-none"
                  value={formData.distanceFromRoad}
                  onChange={handleInputChange}
                  required
                />
                <span className="ml-2 text-sm">meter</span>
              </div>

              <div>
              <label className="text-sm font-medium text-gray-700 mb-1 mr-1">Avstand til trikk/togspor:</label>
                <input
                  type="number"
                  name="distanceFromTracks"
                  className="text-sm w-12 h-8 p-2 border-b-2 border-gray-400 outline-none"
                  value={formData.distanceFromTracks}
                  onChange={handleInputChange}
                  required
                />
                <span className="ml-2 text-sm">meter</span>
              </div>
            </form>
          </div>

          <div className="w-full md:w-3/6 md:border-l-2 md:border-gray-400 md:pl-8" data-cy="right-column">
            <div className='overflow-hidden'>
              [KART]
            </div>
          
          </div>
        </div>
      </div>

      <h2 className="font-medium mt-4 inline-flex">
        Utnyttningsgrad
        <div className="relative flex">
          <Info
            size={14}
            className="ml-1 hover:cursor-pointer"
            onMouseEnter={() => handleMouseEnter('buildingDensity')}
            onMouseLeave={handleMouseLeave}
          />
          {hoveredBox === 'buildingDensity' && (
            <div
              className="absolute top-0 left-6 bg-white shadow-lg border rounded-lg p-3 w-64 text-sm"
              onMouseEnter={() => handleMouseEnter('buildingDensity')}
              onMouseLeave={handleMouseLeave}
            >
                Utnyttingsgraden er et mål på hvor stor del av en tomt som kan bebygges. Den regnes ut ved å dividere bygningens bruksareal (BRA) med tomtens areal (BYA).
            </div>
          )}
        </div>
      </h2>      
      <textarea
        name="buildingDensity"
        className="w-full min-h-28 mt-2 p-4 text-md border-2 border-gray-400 rounded-lg"
        placeholder="Skriv her ..."
        value={formData.buildingDensity}
        onChange={handleInputChange}
        required
      />

<h2 className="font-medium mt-4 inline-flex">
        Vil byggeprosjektet føre til en ny/endret avkjøring til eiendommen?
        <div className="relative flex">
          <Info
            size={14}
            className="ml-1 hover:cursor-pointer"
            onMouseEnter={() => handleMouseEnter('driveway')}
            onMouseLeave={handleMouseLeave}
          />
          {hoveredBox === 'driveway' && (
            <div
              className="absolute top-0 left-6 bg-white shadow-lg border rounded-lg p-3 w-64 text-sm"
              onMouseEnter={() => handleMouseEnter('driveway')}
              onMouseLeave={handleMouseLeave}
            >
                Hvis byggeprosjektet vil føre til en ny eller endret avkjørsel til eiendommen, må du søke om tillatelse fra Statens vegvesen eller kommunen.
            </div>
          )}
        </div>
      </h2>      
      <div className='border-2 border-gray-400 rounded-lg mt-2 p-4'>
<div className='gap-4 flex'>
              <label className='items-center'>
                <input 
                type="radio" 
                name="drivewayChanges"
                value="Ja"
                checked={formData.drivewayChanges === "Ja"}
                onChange={handleRadioChange}
                className='mr-2'
                />
              Ja
              </label>
              
              <label className='items-center'>
                <input 
                type="radio" 
                name="drivewayChanges"
                value="Nei"
                checked={formData.drivewayChanges === "Nei"}
                onChange={handleRadioChange}
                className='mr-2'
                />
              Nei
              </label>
            </div>
            {formData.drivewayChanges === "Ja" && (
              <div className='mt-4 gap-2'>
                <h1 className="text-md font-medium text-gray">Eiendommen vil få ny/endret avkjørsel til (sett kryss):</h1>
                <div className='ml-8 mt-2 flex flex-col gap-2'>
                  <label className='items-center gap-x-2 flex'>
                  <input 
                  type="checkbox" 
                  name='nationalRoadOrCountyRoad'
                  checked={formData.nationalRoadOrCountyRoad}
                  onChange={handleCheckboxChange}
                  />
                  Riksvei eller fylkesvei
                </label>
                <label className='items-center gap-x-2 flex'>
                  <input 
                  type="checkbox" 
                  name='communalRoad'
                  value='communalRoad'
                  checked={formData.communalRoad}
                  onChange={handleCheckboxChange}
                  />
                  Kommunal vei
                </label>
                <label className='items-center gap-x-2 flex'>
                  <input 
                  type="checkbox" 
                  name='privateRoad'
                  value='privateRoad'
                  checked={formData.privateRoad}
                  onChange={handleCheckboxChange}
                  />
                  Privat vei
                </label>
                </div>
                <p className='mt-4 italic'>Du vil få muligheten til å legge til vedlegg som viser at du har avkjøringstillatelse fra
                  Statens vegvesen eller kommunen, eller/og veirett gjennom tinglyst erklæring i senere steg.
                </p>
              </div>
            )}
      </div>
      
      <h1 className='whitespace-nowrap font-medium mt-4'>Er tiltaket i tråd med reguleringsplanen/kommuneplan/pbl?</h1>
      <div className='border-2 border-gray-400 rounded-lg mt-2 p-4'>
            <div className='gap-4 flex'>
              <label className='items-center'>
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
              
              <label className='items-center'>
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
  );
};

export default Step1_0;