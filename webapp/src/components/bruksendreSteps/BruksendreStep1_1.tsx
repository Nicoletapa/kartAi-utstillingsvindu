import React, { useState } from 'react';
import { Info } from 'lucide-react';

interface BruksendreStep1_1Props {
  formData: {
    neighboringBorder: string;
    powerLine: string;
    dangerZone: string;
    protectedBuilding: string;
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
    neighboringBorder: string;
    powerLine: string;
    dangerZone: string;
    protectedBuilding: string;
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

const BruksendreStep1_1: React.FC<BruksendreStep1_1Props> = ({ formData, setFormData, onValidityChange }) => {
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
      (data.neighboringBorder?.trim() ?? '') !== '' &&
      (data.dangerZone?.trim() ?? '') !== '' &&
      (data.protectedBuilding?.trim() ?? '') !== '' &&
      (data.drivewayChanges === "Ja" || data.drivewayChanges === "Nei") &&
      (data.powerLine?.trim() ?? '') !== '';

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

      <div className="border-2 border-gray-400 rounded-lg mt-4 p-4" data-cy="main-container">
        <div className="flex flex-col md:flex-row">
          <div className="w-full md:w-3/6 h-72" data-cy="left-column">
            <h2 className="inline-flex font-medium">
              Korteste avstand
              <div className="relative flex">
                <Info
                  size={14}
                  className="ml-1 hover:cursor-pointer"
                  onMouseEnter={() => handleMouseEnter('shortestDistance')}
                  onMouseLeave={handleMouseLeave}
                />
                {hoveredBox === 'shortestDistance' && (
                  <div
                    className="absolute top-0 left-6 bg-white shadow-lg border rounded-lg p-3 w-64 text-sm"
                    onMouseEnter={() => handleMouseEnter('shortestDistance')}
                    onMouseLeave={handleMouseLeave}
                  >
                    Skriv inn korteste avstand.
                  </div>
                )}
              </div>
            </h2>

            <p className='italic text-sm'>Bruk situasjonskartet og mål opp korteste avstand fra rommet/rommene du skal endre til:</p>

            <form className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 mr-1">Nabogrense:</label>
                <input
                  type="number"
                  name="neighboringBorder"
                  className="required text-sm w-20 h-8 p-2 border-b-2 border-gray-400 outline-none"
                  value={formData.neighboringBorder}
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

      <div className='w-full min-h-28 p-4 border-2 border-gray-400 rounded-lg  mt-4'>
      <h2 className="font-medium inline-flex">
        Kan bruksendringene være i konflikt med omgivelsene?
        <div className="relative flex">
          <Info
            size={14}
            className="ml-1 hover:cursor-pointer"
            onMouseEnter={() => handleMouseEnter('conflictsWithSurroundings')}
            onMouseLeave={handleMouseLeave}
          />
          {hoveredBox === 'conflictsWithSurroundings' && (
            <div
              className="absolute top-0 left-6 bg-white shadow-lg border rounded-lg p-3 w-64 text-sm"
              onMouseEnter={() => handleMouseEnter('conflictsWithSurroundings')}
              onMouseLeave={handleMouseLeave}
            >
                konflikt
            </div>
          )}
        </div>
      </h2>  
      <p className='italic text-sm mb-2'>Svarer du ja på noen av disse må du legge ved søknad om dispensasjon eller tillatelse/vedtak.</p>    

          <div className='space-y-4'>
        <div className='flex justify-between items-center mr-4'>
          <span>Er rommet/rommene du skal bruksendre i nærheten av høyspent kraftlinje?</span>
          <div className='flex gap-4'> 
            <label className='items-center mr-4'>
              <input 
                type="radio" 
                name="powerLine"
                value="Ja"
                checked={formData.powerLine === "Ja"}
                onChange={handleRadioChange}
                className='mr-2'
              />
              Ja
            </label>
            
            <label className='items-center'>
              <input 
                type="radio" 
                name="powerLine"
                value="Nei"
                checked={formData.powerLine === "Nei"}
                onChange={handleRadioChange}
                className='mr-2'
              />
              Nei
            </label>
          </div>
        </div>

        <div className='flex justify-between items-center mr-4'>
          <span>Bruksendrer du i et flom-, ras- eller skredsutsatt område?</span>
          <div className='flex gap-4'>
            <label className='items-center mr-4'>
              <input 
                type="radio" 
                name="dangerZone"
                value="Ja"
                checked={formData.dangerZone === "Ja"}
                onChange={handleRadioChange}
                className='mr-2'
              />
              Ja
            </label>
            
            <label className='items-center'>
              <input 
                type="radio" 
                name="dangerZone"
                value="Nei"
                checked={formData.dangerZone === "Nei"}
                onChange={handleRadioChange}
                className='mr-2'
              />
              Nei
            </label>
          </div>
        </div>

        <div className='flex justify-between items-center mr-4'>
          <span>Er bygningen du skal bruksendre verneverdig eller et kulturminne?</span>
          <div className='flex gap-4'>
            <label className='items-center mr-4'>
              <input 
                type="radio" 
                name="protectedBuilding"
                value="Ja"
                checked={formData.protectedBuilding === "Ja"}
                onChange={handleRadioChange}
                className='mr-2'
              />
              Ja
            </label>
            
            <label className='items-center'>
              <input 
                type="radio" 
                name="protectedBuilding"
                value="Nei"
                checked={formData.protectedBuilding === "Nei"}
                onChange={handleRadioChange}
                className='mr-2'
              />
              Nei
            </label>
          </div>
        </div>
      </div>

          </div>

     
      <div className='border-2 border-gray-400 rounded-lg mt-4 p-4'>
      <h2 className="font-medium inline-flex mb-2">
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
      </div>
  );
};

export default BruksendreStep1_1;