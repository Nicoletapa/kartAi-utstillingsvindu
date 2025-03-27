import React, { useState } from 'react';
import { Info } from 'lucide-react';

interface Step1_1Props {
  formData: {
    size: string;
    ridgeHeight: string;
    eavesHeight: string;
    distanceFromVACables: string;
    distanceFromPowerCables: string;
    distanceFromRoad: string;
    distanceFromTracks: string;
    calculationMethod: string[];
    buildingDensity: string;
    driveway: string;
    drivewayChanges: string;
    noDrivewayChanges: string;
    planCompliance: string;
    nonComplianceReason: string;
    nationalRoadOrCountyRoad: boolean;
    communalRoad: boolean;
    privateRoad: boolean;
    neighboringBorder: string;
    middleOfRoad: string;
    closestToNeighbor: string;
    allowedBuildingDensity: string;
    buildingDensityAfter: string;
    netArea: string;
    areaToday: string;
    areaAfter: string;
    tramOrTrainTrack: string;
    waterOrSewerLine: string;
    powerLine: string;
    beachOrRiver: string;
    dangerZone: string;
    endangeredSpecies: string;
    protectedBuildings: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    size: string;
    ridgeHeight: string;
    eavesHeight: string;
    distanceFromVACables: string;
    distanceFromPowerCables: string;
    distanceFromRoad: string;
    distanceFromTracks: string;
    calculationMethod: string[];
    buildingDensity: string;
    driveway: string;
    drivewayChanges: string;
    noDrivewayChanges: string;
    planCompliance: string;
    nonComplianceReason: string;
    nationalRoadOrCountyRoad: boolean;
    communalRoad: boolean;
    privateRoad: boolean;
    neighboringBorder: string;
    middleOfRoad: string;
    closestToNeighbor: string;
    allowedBuildingDensity: string;
    buildingDensityAfter: string;
    netArea: string;
    areaToday: string;
    areaAfter: string;
    tramOrTrainTrack: string;
    waterOrSewerLine: string;
    powerLine: string;
    beachOrRiver: string;
    dangerZone: string;
    endangeredSpecies: string;
    protectedBuildings: string;
  }>>;
  onValidityChange: (isValid: boolean) => void;
}

const calculcationMethod = [
    { label: "BYA -", value: "Bebygd areal i m²"},
    { label: "BRA -", value: "Bruksarea i m²"},
    { label: "T-BRA -", value: "Tillatt bruksareal i m²"},
    { label: "%BYA -", value: "Bebygd areal i %"},
    { label: "%BRA -", value: "Bruksareal i %"},
    { label: "%TU -", value: "Tillatt utnyttelsesgrad i %"},
    { label: "U-grad", value: "(denne betegnelsen brukes i enkelte eldre planer)"},

]

const Step1_1: React.FC<Step1_1Props> = ({ formData, setFormData, onValidityChange }) => {
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
      (data.netArea?.trim() ?? '') !== '' &&
      (data.areaAfter?.trim() ?? '') !== '' &&
      (data.areaToday?.trim() ?? '') !== '' &&
      (data.buildingDensityAfter?.trim() ?? '') !== '' &&
      (data.allowedBuildingDensity?.trim() ?? '') !== '' &&
      (data.neighboringBorder?.trim() ?? '') !== '' &&
      (data.middleOfRoad?.trim() ?? '') !== '' &&
      (data.closestToNeighbor?.trim() ?? '') !== '' &&
      (data.ridgeHeight?.trim() ?? '') !== '' &&
      (data.eavesHeight?.trim() ?? '') !== '' &&
      (data.calculationMethod?.length ?? 0) > 0 &&
      (data.buildingDensity?.trim() ?? '') !== '' &&
      (data.distanceFromVACables?.trim() ?? '') !== '' &&
      (data.distanceFromPowerCables?.trim() ?? '') !== '' &&
      (data.distanceFromRoad?.trim() ?? '') !== '' &&
      (data.distanceFromTracks?.trim() ?? '') !== '' &&
      (data.tramOrTrainTrack === "Ja" || data.tramOrTrainTrack === "Nei") &&
      (data.waterOrSewerLine === "Ja" || data.waterOrSewerLine === "Nei") &&
      (data.protectedBuildings === "Ja" || data.protectedBuildings === "Nei") &&
      (data.powerLine === "Ja" || data.powerLine === "Nei") &&
      (data.dangerZone === "Ja" || data.dangerZone === "Nei") &&
      (data.beachOrRiver === "Ja" || data.beachOrRiver === "Nei") &&
      (data.endangeredSpecies === "Ja" || data.endangeredSpecies === "Nei") &&
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

            <form className="mt-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 mr-1">Størrelse:</label>
                <input
                  type="number"
                  name="size"
                  className="required text-sm w-20 h-8 p-2 border-b-2 border-gray-400 outline-none mb-2"
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
                  className="text-sm w-20 h-8 p-2 border-b-2 border-gray-400 outline-none mb-2"
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
                  className="text-sm w-20 h-8 p-2 border-b-2 border-gray-400 outline-none mb-2"
                  value={formData.eavesHeight}
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
                  className="text-sm w-12 h-8 p-2 border-b-2 border-gray-400 outline-none mb-2"
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
                  className="text-sm w-12 h-8 p-2 border-b-2 border-gray-400 outline-none mb-2"
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
                  className="text-sm w-12 h-8 p-2 border-b-2 border-gray-400 outline-none mb-2"
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
                  className="text-sm w-12 h-8 p-2 border-b-2 border-gray-400 outline-none mb-2"
                  value={formData.distanceFromTracks}
                  onChange={handleInputChange}
                  required
                />
                <span className="ml-2 text-sm">meter</span>
              </div>

                            <h2 className="inline-flex font-medium mt-2">
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
                                    Skal du rive, eller er noe så langt unna at det ikke vises på situasjonskartet? Da kan du stryke over punktet.
                                  </div>
                                )}
                              </div>
                            </h2>
                
                            <p className='italic text-sm mb-2'>Bruk situasjonskartet og mål opp korteste avstand fra rommet/rommene du skal endre til:</p>
                
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 mr-1">Nabogrense:</label>
                <input
                  type="number"
                  name="neighboringBorder"
                  className="required text-sm w-20 h-8 p-2 border-b-2 border-gray-400 outline-none mb-2"
                  value={formData.neighboringBorder}
                  onChange={handleInputChange}
                  required
                />
                <span className="ml-2 text-sm">meter</span>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 mr-1">Midten av vei:</label>
                <input
                  type="number"
                  name="middleOfRoad"
                  className="required text-sm w-20 h-8 p-2 border-b-2 border-gray-400 outline-none mb-2"
                  value={formData.middleOfRoad}
                  onChange={handleInputChange}
                  required
                />
                <span className="ml-2 text-sm">meter</span>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 mr-1">Nærmeste bygning på naboeiendom:</label>
                <input
                  type="number"
                  name="closestToNeighbor"
                  className="required text-sm w-20 h-8 p-2 border-b-2 border-gray-400 outline-none mb-2"
                  value={formData.closestToNeighbor}
                  onChange={handleInputChange}
                  required
                />
                <span className="ml-2 text-sm">meter</span>
              </div>
            </form>
          </div>

          <div className="w-full md:w-3/6 md:border-l-2 md:border-gray-400 md:pl-8" data-cy="right-column">
          <h2 className="font-medium inline-flex">
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
    <p className='text-sm italic mb-2'>Hva er beregningsmåten for grad av utnytting for eiendommen din? (Velg minst én) </p>
    <div className="space-y-2">
  {calculcationMethod.map((method) => (
    <div key={method.value} className="flex items-start">
      <input
        type="checkbox"
        id={`calc-method-${method.value}`}
        checked={formData.calculationMethod?.includes(method.value) ?? false}
        onChange={() => {
          const currentMethods = formData.calculationMethod || [];
          const updatedMethods = currentMethods.includes(method.value)
            ? currentMethods.filter(v => v !== method.value)
            : [...currentMethods, method.value];
          const updatedFormData = { ...formData, calculationMethod: updatedMethods };
          setFormData(updatedFormData);
          checkFormValidity(updatedFormData);
        }}
        className="mt-1 mr-2"
      />
      <label htmlFor={`calc-method-${method.value}`} className="flex flex-col">
        <span>{method.label} {method.value}</span>
      </label>
    </div>
  ))}
</div>
          </div>
        </div>
      </div>

      <div className='border-2 border-gray-400 rounded-lg mt-4 p-4'>
  <h2 className="font-medium inline-flex">
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
  <p className='text-sm mb-1'>Oppgi arealet til alle bygninger på eiendommen din, og regn ut ny grad av utnytting.</p>
  <p className='text-sm font-medium italic mb-4'>Bruk den beregningsmåten du krysset av for over.</p>

  <div className="space-y-4">
    <div className="flex items-center">
      <label className="text-sm font-medium text-gray-700 w-[300px]">
        Tillatt grad av utnytting:
      </label>
      <input
        type="text"
        name="allowedBuildingDensity"
        className="text-sm w-72 h-8 p-2 border border-gray-400 rounded ml-20"
        value={formData.allowedBuildingDensity}
        onChange={handleInputChange}
        required
      />
    </div>

    <div className="flex items-center">
      <label className="text-sm font-medium text-gray-700 w-[300px]">
        Tomtens nettoareal:
      </label>
      <input
        type="text"
        name="netArea"
        className="text-sm w-72 h-8 p-2 border border-gray-400 rounded ml-20"
        value={formData.netArea}
        onChange={handleInputChange}
        required
      />
    <span className="ml-2 text-sm">m²</span>
    </div>

    <div className="flex items-center">
      <label className="text-sm font-medium whitespace-nowrap text-gray-700 w-[300px]">
        Areal av bygninger, konstruksjoner og parkering i dag:
      </label>
      <input
        type="text"
        name="areaToday"
        className="text-sm w-72 h-8 p-2 border border-gray-400 rounded ml-20"
        value={formData.areaToday}
        onChange={handleInputChange}
        required
      />
    <span className="ml-2 text-sm">m²</span>
    </div>

    <div className="flex items-center">
      <label className="text-sm font-medium whitespace-nowrap text-gray-700 w-[300px]">
        Areal av bygninger, konstruksjoner og parkering etterpå:
      </label>
      <input
        type="text"
        name="areaAfter"
        className="text-sm w-72 h-8 p-2 border border-gray-400 rounded ml-20"
        value={formData.areaAfter}
        onChange={handleInputChange}
        required
      />
    <span className="ml-2 text-sm">m²</span>
    </div>

    <div className="flex items-center">
      <label className="text-sm font-medium text-gray-700 w-[300px]">
        Grad av utnytting etter prosjekt:
      </label>
      <input
        type="text"
        name="buildingDensityAfter"
        className="text-sm w-72 h-8 p-2 border border-gray-400 rounded ml-20"
        value={formData.buildingDensityAfter}
        onChange={handleInputChange}
        required
      />
    </div>
  </div>
</div>
      
<div className='w-full min-h-28 mt-4 p-4 border-2 border-gray-400 rounded-lg space-y-4'>
      <h2 className="font-medium inline-flex">
        Kan byggeplanene dine være i konflikt med omgivelsene?
        <div className="relative flex">
          <Info
            size={14}
            className="ml-1 hover:cursor-pointer"
            onMouseEnter={() => handleMouseEnter('conflictWithSurroundings')}
            onMouseLeave={handleMouseLeave}
          />
          {hoveredBox === 'conflictWithSurroundings' && (
            <div
              className="absolute top-0 left-6 bg-white shadow-lg border rounded-lg p-3 w-64 text-sm"
              onMouseEnter={() => handleMouseEnter('conflictWithSurroundings')}
              onMouseLeave={handleMouseLeave}
            >
              Her kan du krysse av for endringene du planlegger å gjøre på eiendommen din.
            </div>
          )}
        </div>
      </h2>
      <p className='text-sm italic'>Svarer du ja på noen av disse, må du legge ved tillatelse eller uttalelse fra eier.</p>

        <div className='flex justify-between items-center mr-4'>
          <span>Er det mindre enn 30 meter til nærmeste trikke-eller togspor?</span>
          <div className='flex gap-4'> 
            <label className='items-center mr-4'>
              <input 
                type="radio" 
                name="tramOrTrainTrack"
                value="Ja"
                checked={formData.tramOrTrainTrack === "Ja"}
                onChange={handleRadioChange}
                className='mr-2'
              />
              Ja
            </label>
            
            <label className='items-center'>
              <input 
                type="radio" 
                name="tramOrTrainTrack"
                value="Nei"
                checked={formData.tramOrTrainTrack === "Nei"}
                onChange={handleRadioChange}
                className='mr-2'
              />
              Nei
            </label>
          </div>
        </div>

        <div className='flex justify-between items-center mr-4'>
          <span>Bygger/river du i nærheten av en vann- og avløpsledning?</span>
          <div className='flex gap-4'>
            <label className='items-center mr-4'>
              <input 
                type="radio" 
                name="waterOrSewerLine"
                value="Ja"
                checked={formData.waterOrSewerLine === "Ja"}
                onChange={handleRadioChange}
                className='mr-2'
              />
              Ja
            </label>
            
            <label className='items-center'>
              <input 
                type="radio" 
                name="waterOrSewerLine"
                value="Nei"
                checked={formData.waterOrSewerLine === "Nei"}
                onChange={handleRadioChange}
                className='mr-2'
              />
              Nei
            </label>
          </div>
        </div>

        <div className='flex justify-between items-center mr-4'>
          <span>Bygger/river du i nærheten av høyspent kraftlinje?</span>
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
          <div className='border border-gray-300' />
          <p className='text-sm italic'>Svarer du ja på noen av disse, må du legge ved tillatelse eller uttalelse fra eier.</p>

        <div className='flex justify-between items-center mr-4'>
          <span>Bygger/river du i nærheten av strandsonen eller sjø/elv/vassdrag?</span>
          <div className='flex gap-4'>
            <label className='items-center mr-4'>
              <input 
                type="radio" 
                name="beachOrRiver"
                value="Ja"
                checked={formData.beachOrRiver === "Ja"}
                onChange={handleRadioChange}
                className='mr-2'
              />
              Ja
            </label>
            
            <label className='items-center'>
              <input 
                type="radio" 
                name="beachOrRiver"
                value="Nei"
                checked={formData.beachOrRiver === "Nei"}
                onChange={handleRadioChange}
                className='mr-2'
              />
              Nei
            </label>
          </div>
        </div>
        <div className='flex justify-between items-center mr-4'>
          <span>Skal du bygge/rive i et flom-, ras- eller skredutsatt område?</span>
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
          <span>Finnes det truende eller vernede arter på eiendommen er i nærheten?</span>
          <div className='flex gap-4'>
            <label className='items-center mr-4'>
              <input 
                type="radio" 
                name="endangeredSpecies"
                value="Ja"
                checked={formData.endangeredSpecies === "Ja"}
                onChange={handleRadioChange}
                className='mr-2'
              />
              Ja
            </label>
            
            <label className='items-center'>
              <input 
                type="radio" 
                name="endangeredSpecies"
                value="Nei"
                checked={formData.endangeredSpecies === "Nei"}
                onChange={handleRadioChange}
                className='mr-2'
              />
              Nei
            </label>
          </div>
        </div>
        <div className='flex justify-between items-center mr-4'>
          <span>Finnes det kulturminner eller verneverdig bebyggelse på eiendommen eller i nærheten?</span>
          <div className='flex gap-4'>
            <label className='items-center mr-4'>
              <input 
                type="radio" 
                name="protectedBuildings"
                value="Ja"
                checked={formData.protectedBuildings === "Ja"}
                onChange={handleRadioChange}
                className='mr-2'
              />
              Ja
            </label>
            
            <label className='items-center'>
              <input 
                type="radio" 
                name="protectedBuildings"
                value="Nei"
                checked={formData.protectedBuildings === "Nei"}
                onChange={handleRadioChange}
                className='mr-2'
              />
              Nei
            </label>
          </div>
        </div>
      </div>

      <div className='border-2 border-gray-400 rounded-lg mt-4 p-4'>
        <h2 className="font-medium mb-2 inline-flex">
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

export default Step1_1;