import React, { useState, useEffect } from 'react';
import { Info } from 'lucide-react';

// Define a type for the form data to avoid repetition
type FormDataType = {
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
  internalStaircase: string;
  bearingWallsorConstructions: string;
  insertOrRemoveWindowOrDoor: string;
  otherPhysicalChanges: string;
  description: string;
  yesDispensationIsAttached: boolean;
  yesPermitsAreAttached: boolean;
  noDispensationNeeded: boolean;
};

interface BruksendreStep1_1Props {
  applicationID: number;
  formData: FormDataType;
  setFormData: React.Dispatch<React.SetStateAction<FormDataType>>;
  onValidityChange: (isValid: boolean) => void;
}

// Create reusable components for common UI patterns
interface TooltipProps {
  id: string;
  content: string;
  isVisible: boolean;
  onMouseEnter: (id: string) => void;
  onMouseLeave: () => void;
}

const Tooltip: React.FC<TooltipProps> = ({ 
  id, 
  content, 
  isVisible, 
  onMouseEnter, 
  onMouseLeave 
}) => (
  <div className="relative flex">
    <Info
      size={14}
      className="ml-1 hover:cursor-pointer"
      onMouseEnter={() => onMouseEnter(id)}
      onMouseLeave={onMouseLeave}
    />
    {isVisible && (
      <div
        className="absolute top-0 left-6 bg-white shadow-lg border rounded-lg p-3 w-64 text-sm z-10"
        onMouseEnter={() => onMouseEnter(id)}
        onMouseLeave={onMouseLeave}
      >
        {content}
      </div>
    )}
  </div>
);

interface RadioGroupProps {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const RadioGroup: React.FC<RadioGroupProps> = ({ name, label, options, value, onChange }) => (
  <div className='flex justify-between items-center mr-4'>
    <span>{label}</span>
    <div className='flex gap-4'>
      {options.map((option) => (
        <label key={option.value} className='items-center mr-4'>
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={onChange}
            className='mr-2'
          />
          {option.label}
        </label>
      ))}
    </div>
  </div>
);

const BruksendreStep1_1: React.FC<BruksendreStep1_1Props> = ({ 
  formData,
  applicationID, 
  setFormData, 
  onValidityChange 
}) => {

  useEffect (() => {
    console.log('BruksendreStep1_1 received applicationID:', applicationID)}, [applicationID]
  );
  const [hoveredBox, setHoveredBox] = useState<string | null>(null);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  // Tooltip handling
  const handleMouseEnter = (box: string) => {
    if (timeoutId) clearTimeout(timeoutId);
    setHoveredBox(box);
  };

  const handleMouseLeave = () => {
    const id = setTimeout(() => setHoveredBox(null), 300);
    setTimeoutId(id);
  };

  useEffect(() => {
    // Clean up timeout when component unmounts
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [timeoutId]);

  // Form handlers
  const handleFormChange = <T extends string | boolean>(name: string, value: T) => {
    const updatedFormData = { ...formData, [name]: value };
    setFormData(updatedFormData);
    checkFormValidity(updatedFormData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    handleFormChange(e.target.name, e.target.value);
  };

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFormChange(e.target.name, e.target.value);
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFormChange(e.target.name, e.target.checked);
  };

  const checkFormValidity = (data: typeof formData) => {
    const basicFieldsValid = 
      (data.neighboringBorder?.trim() ?? '') !== '' &&
      (data.dangerZone?.trim() ?? '') !== '' &&
      (data.protectedBuilding?.trim() ?? '') !== '' &&
      (data.drivewayChanges === "Ja" || data.drivewayChanges === "Nei") &&
      (data.powerLine?.trim() ?? '') !== '';

    const drivewayValid = data.drivewayChanges === "Nei" || 
      (data.nationalRoadOrCountyRoad || data.communalRoad || data.privateRoad);

    const isValid = basicFieldsValid && drivewayValid;
    onValidityChange(isValid);
  };

  // Common tooltip options
  const tooltips = {
    shortestDistance: "Skriv inn korteste avstand.",
    conflictsWithSurroundings: "konflikt",
    driveway: "Hvis byggeprosjektet vil føre til en ny eller endret avkjørsel til eiendommen, må du søke om tillatelse fra Statens vegvesen eller kommunen."
  };

  // Common radio options
  const yesNoOptions = [
    { value: "Ja", label: "Ja" },
    { value: "Nei", label: "Nei" }
  ];

  return (
    <div className="justify-center flex flex-col w-full">
      <h1 className="text-3xl font-bold justify-center flex">Detaljer til det du vil gjøre</h1>

      {/* Distance Information Section */}
      <section className="border-2 border-gray-400 rounded-lg mt-4 p-4" data-cy="main-container">
        <div className="flex flex-col md:flex-row">
          <div className="w-full md:w-3/6 h-72" data-cy="left-column">
            <h2 className="inline-flex font-medium">
              Korteste avstand
              <Tooltip
                id="shortestDistance"
                content={tooltips.shortestDistance}
                isVisible={hoveredBox === 'shortestDistance'}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              />
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
      </section>

      {/* Environmental Conflicts Section */}
      <section className='w-full min-h-28 p-4 border-2 border-gray-400 rounded-lg mt-4'>
        <h2 className="font-medium inline-flex">
          Kan bruksendringene være i konflikt med omgivelsene?
          <Tooltip
            id="conflictsWithSurroundings"
            content={tooltips.conflictsWithSurroundings}
            isVisible={hoveredBox === 'conflictsWithSurroundings'}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          />
        </h2>  
        <p className='italic text-sm mb-2'>
          Svarer du ja på noen av disse må du legge ved søknad om dispensasjon eller tillatelse/vedtak.
        </p>    

        <div className='space-y-4'>
          <RadioGroup
            name="powerLine"
            label="Er rommet/rommene du skal bruksendre i nærheten av høyspent kraftlinje?"
            options={yesNoOptions}
            value={formData.powerLine}
            onChange={handleRadioChange}
          />

          <RadioGroup
            name="dangerZone"
            label="Bruksendrer du i et flom-, ras- eller skredsutsatt område?"
            options={yesNoOptions}
            value={formData.dangerZone}
            onChange={handleRadioChange}
          />

          <RadioGroup
            name="protectedBuilding"
            label="Er bygningen du skal bruksendre verneverdig eller et kulturminne?"
            options={yesNoOptions}
            value={formData.protectedBuilding}
            onChange={handleRadioChange}
          />
        </div>
      </section>

      {/* Driveway Section */}
      <section className='border-2 border-gray-400 rounded-lg mt-4 p-4'>
        <h2 className="font-medium inline-flex mb-2">
          Vil byggeprosjektet føre til en ny/endret avkjøring til eiendommen?
          <Tooltip
            id="driveway"
            content={tooltips.driveway}
            isVisible={hoveredBox === 'driveway'}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          />
        </h2> 
        
        <div className='gap-4 flex'>
          {yesNoOptions.map(option => (
            <label key={option.value} className='items-center'>
              <input 
                type="radio" 
                name="drivewayChanges"
                value={option.value}
                checked={formData.drivewayChanges === option.value}
                onChange={handleRadioChange}
                className='mr-2'
              />
              {option.label}
            </label>
          ))}
        </div>
        
        {formData.drivewayChanges === "Ja" && (
          <div className='mt-4 gap-2'>
            <h1 className="text-md font-medium text-gray">
              Eiendommen vil få ny/endret avkjørsel til (sett kryss):
            </h1>
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
                  checked={formData.communalRoad}
                  onChange={handleCheckboxChange}
                />
                Kommunal vei
              </label>
              <label className='items-center gap-x-2 flex'>
                <input 
                  type="checkbox" 
                  name='privateRoad'
                  checked={formData.privateRoad}
                  onChange={handleCheckboxChange}
                />
                Privat vei
              </label>
            </div>
            <p className='mt-4 italic'>
              Du vil få muligheten til å legge til vedlegg som viser at du har avkjøringstillatelse fra
              Statens vegvesen eller kommunen, eller/og veirett gjennom tinglyst erklæring i senere steg.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

export default BruksendreStep1_1;