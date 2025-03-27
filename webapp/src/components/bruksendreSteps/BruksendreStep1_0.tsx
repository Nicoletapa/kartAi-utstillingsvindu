import React from 'react'
import { useState } from 'react'
import { Info } from 'lucide-react'

interface BruksendreStep1_0Props {
  formData: {
    internalStaircase: string;
    bearingWallsorConstructions: string;
    insertOrRemoveWindowOrDoor: string;
    otherPhysicalChanges: string;
    description: string;
    yesDispensationIsAttached: boolean;
    yesPermitsAreAttached: boolean;
    noDispensationNeeded: boolean;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    internalStaircase: string;
    bearingWallsorConstructions: string;
    insertOrRemoveWindowOrDoor: string;
    otherPhysicalChanges: string;
    description: string;
    yesDispensationIsAttached: boolean;
    yesPermitsAreAttached: boolean;
    noDispensationNeeded: boolean;
  }>>;
  onValidityChange: (isValid: boolean) => void;
}

const BruksendreStep1_0: React.FC<BruksendreStep1_0Props> = ({ formData, setFormData, onValidityChange }) => {
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

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updatedFormData = { ...formData, [name]: value };
    setFormData(updatedFormData);
    checkFormValidity(updatedFormData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
    const basicsFieldValid = 
      (data.description?.trim() ?? '') !== '' &&
      (data.internalStaircase === "Ja" || data.internalStaircase === "Nei") &&
      (data.insertOrRemoveWindowOrDoor === "Ja" || data.insertOrRemoveWindowOrDoor === "Nei") &&
      (data.otherPhysicalChanges === "Ja" || data.otherPhysicalChanges === "Nei") &&
      (data.bearingWallsorConstructions === "Ja" || data.bearingWallsorConstructions === "Nei");

    const dispensationOrOtherPermits = 
      data.yesDispensationIsAttached || 
      data.yesPermitsAreAttached || 
      data.noDispensationNeeded;

    const isValid = basicsFieldValid && dispensationOrOtherPermits;
    onValidityChange(isValid);
  };

  return (
    <div className="justify-center flex flex-col w-full">
      <h1 className="text-3xl font-bold justify-center flex">Hva vil du gjøre på eiendommen din?</h1>
      <h2 className="font-medium inline-flex mt-4">
        Kryss av for endringene du vil gjøre:
        <div className="relative flex">
          <Info
            size={14}
            className="ml-1 hover:cursor-pointer"
            onMouseEnter={() => handleMouseEnter('checkboxChanges')}
            onMouseLeave={handleMouseLeave}
          />
          {hoveredBox === 'checkboxChanges' && (
            <div
              className="absolute top-0 left-6 bg-white shadow-lg border rounded-lg p-3 w-64 text-sm"
              onMouseEnter={() => handleMouseEnter('checkboxChanges')}
              onMouseLeave={handleMouseLeave}
            >
              Her kan du krysse av for endringene du planlegger å gjøre på eiendommen din.
            </div>
          )}
        </div>
      </h2>
      <div className='w-full min-h-28 mt-2 p-4 border-2 border-gray-400 rounded-lg space-y-4'>
        <div className='flex justify-between items-center mr-4'>
          <span>Skal du sette inn innvendig trapp?</span>
          <div className='flex gap-4'> 
            <label className='items-center mr-4'>
              <input 
                type="radio" 
                name="internalStaircase"
                value="Ja"
                checked={formData.internalStaircase === "Ja"}
                onChange={handleRadioChange}
                className='mr-2'
              />
              Ja
            </label>
            
            <label className='items-center'>
              <input 
                type="radio" 
                name="internalStaircase"
                value="Nei"
                checked={formData.internalStaircase === "Nei"}
                onChange={handleRadioChange}
                className='mr-2'
              />
              Nei
            </label>
          </div>
        </div>

        <div className='flex justify-between items-center mr-4'>
          <span>Skal du endre på bærende vegg(er) eller bærende konstruksjoner?</span>
          <div className='flex gap-4'>
            <label className='items-center mr-4'>
              <input 
                type="radio" 
                name="bearingWallsorConstructions"
                value="Ja"
                checked={formData.bearingWallsorConstructions === "Ja"}
                onChange={handleRadioChange}
                className='mr-2'
              />
              Ja
            </label>
            
            <label className='items-center'>
              <input 
                type="radio" 
                name="bearingWallsorConstructions"
                value="Nei"
                checked={formData.bearingWallsorConstructions === "Nei"}
                onChange={handleRadioChange}
                className='mr-2'
              />
              Nei
            </label>
          </div>
        </div>

        <div className='flex justify-between items-center mr-4'>
          <span>Skal du sette inn eller fjerne vindu eller dør i yttervegg?</span>
          <div className='flex gap-4'>
            <label className='items-center mr-4'>
              <input 
                type="radio" 
                name="insertOrRemoveWindowOrDoor"
                value="Ja"
                checked={formData.insertOrRemoveWindowOrDoor === "Ja"}
                onChange={handleRadioChange}
                className='mr-2'
              />
              Ja
            </label>
            
            <label className='items-center'>
              <input 
                type="radio" 
                name="insertOrRemoveWindowOrDoor"
                value="Nei"
                checked={formData.insertOrRemoveWindowOrDoor === "Nei"}
                onChange={handleRadioChange}
                className='mr-2'
              />
              Nei
            </label>
          </div>
        </div>

        <div className='flex justify-between items-center mr-4'>
          <span>Skal du gjøre andre fysiske endringer av rommet/rommene?</span>
          <div className='flex gap-4'>
            <label className='items-center mr-4'>
              <input 
                type="radio" 
                name="otherPhysicalChanges"
                value="Ja"
                checked={formData.otherPhysicalChanges === "Ja"}
                onChange={handleRadioChange}
                className='mr-2'
              />
              Ja
            </label>
            
            <label className='items-center'>
              <input 
                type="radio" 
                name="otherPhysicalChanges"
                value="Nei"
                checked={formData.otherPhysicalChanges === "Nei"}
                onChange={handleRadioChange}
                className='mr-2'
              />
              Nei
            </label>
          </div>
        </div>
      </div>
      
      <h2 className="font-medium mt-4 inline-flex">
        Beskrivelse
        <div className="relative flex">
          <Info
            size={14}
            className="ml-1 hover:cursor-pointer"
            onMouseEnter={() => handleMouseEnter('description')}
            onMouseLeave={handleMouseLeave}
          />
          {hoveredBox === 'description' && (
            <div
              className="absolute top-0 left-6 bg-white shadow-lg border rounded-lg p-3 w-64 text-sm"
              onMouseEnter={() => handleMouseEnter('description')}
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
            
      <h2 className='font-medium mt-4'>Trenger du dispensasjon eller andre tilltatelser?</h2>
      <div className='w-full h-fit mt-2 p-4 border-2 border-gray-400 rounded-lg'>
        <div className='gap-4 flex flex-wrap'>
          <label className='items-center gap-x-2 flex whitespace-nowrap mr-4'>
            <input 
              type="checkbox" 
              name='yesDispensationIsAttached'
              checked={formData.yesDispensationIsAttached}
              onChange={handleCheckboxChange}
            />
            Ja, men jeg har ikke søkt
          </label>

          <label className='items-center gap-x-2 flex whitespace-nowrap mr-4'>
            <input 
              type="checkbox" 
              name='yesPermitsAreAttached'
              checked={formData.yesPermitsAreAttached}
              onChange={handleCheckboxChange}
            />
            Ja, jeg har søknad/tillatelse/vedtak
          </label>

          <label className='items-center gap-x-2 flex whitespace-nowrap'>
            <input 
              type="checkbox" 
              name='noDispensationNeeded'
              checked={formData.noDispensationNeeded}
              onChange={handleCheckboxChange}
            />
            Nei, jeg trenger ikke
          </label>
        </div>

        {(formData.yesDispensationIsAttached || formData.yesPermitsAreAttached) && (
          <div className="mt-4 p-3 border rounded-lg text-sm"
            style={{
              backgroundColor: formData.yesDispensationIsAttached ? '#fefce8' : '#eff6ff',
              borderColor: formData.yesDispensationIsAttached ? '#fef08a' : '#bfdbfe'
            }}
          >
            {formData.yesDispensationIsAttached && (
              <p className="text-yellow-800">
                Du kan søke om dispensasjon i senere steg i prosessen.
              </p>
            )}
            {formData.yesPermitsAreAttached && (
              <p className="text-blue-800">
                Vennligst last opp dokumentasjonen din i senere steg. Du må ha vedlegg som bekrefter at du har 
                nødvendige tillatelser for å gjennomføre endringene.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default BruksendreStep1_0