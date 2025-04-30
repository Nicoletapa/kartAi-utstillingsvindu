import React from 'react'
import { useState } from 'react'
import { Info } from 'lucide-react'
import { ApplicationService } from '~/utils/api-service';
import { resolveFieldPath } from '~/utils/field-mappings';

interface BruksendreStep1_0Props {
  applicationID: number;
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

const BruksendreStep1_0: React.FC<BruksendreStep1_0Props> = ({ 
  applicationID, 
  formData, 
  setFormData: externalSetFormData, 
  onValidityChange 
}) => {
  const [hoveredBox, setHoveredBox] = useState<string | null>(null);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const { saveField, isSaving } = ApplicationService.useSaveFormData(applicationID, 'sma-prosjekter');
  
  const handleMouseEnter = (box: string) => {
    if (timeoutId) clearTimeout(timeoutId);
    setHoveredBox(box);
  };

  const handleMouseLeave = () => {
    const id = setTimeout(() => setHoveredBox(null), 300);
    setTimeoutId(id);
  };

  const handleFieldChange = (name: string, value: string | boolean | string[]) => {
    const updatedFormData = {
      ...formData,
      [name]: value,
    };

    externalSetFormData((prev) => ({ ...prev, [name]: value }));
    checkFormValidity(updatedFormData);

    console.log(`Saving field: ${name} with value:`, value);

    const fieldPath = resolveFieldPath(name, 'sma-prosjekter');
    
    if (Array.isArray(value)) {
     void saveField(fieldPath, JSON.stringify(value));
    } else {
     void saveField(fieldPath, value.toString());
    }
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

  // Helper component for radio buttons
  const RadioField = ({ name, label, value }: { name: string; label: string; value: string }) => (
    <div className='flex justify-between items-center mr-4'>
      <span>{label}</span>
      <div className='flex gap-4'>
        <label className='items-center mr-4'>
          <input 
            type="radio" 
            name={name}
            value="Ja"
            checked={formData[name as keyof typeof formData] === "Ja"}
            onChange={(e) => handleFieldChange(name, e.target.value)}
            className='mr-2'
          />
          Ja
        </label>
        <label className='items-center'>
          <input 
            type="radio" 
            name={name}
            value="Nei"
            checked={formData[name as keyof typeof formData] === "Nei"}
            onChange={(e) => handleFieldChange(name, e.target.value)}
            className='mr-2'
          />
          Nei
        </label>
      </div>
    </div>
  );

  // Helper component for checkboxes
  const CheckboxField = ({ name, label }: { name: string; label: string }) => (
    <label className='items-center gap-x-2 flex whitespace-nowrap mr-4'>
      <input 
        type="checkbox" 
        name={name}
        checked={formData[name as keyof typeof formData] as boolean}
        onChange={(e) => handleFieldChange(name, e.target.checked)}
      />
      {label}
    </label>
  );

  // Helper component for info tooltip
  const InfoTooltip = ({ content, boxName }: { content: string; boxName: string }) => (
    <div className="relative flex">
      <Info
        size={14}
        className="ml-1 hover:cursor-pointer"
        onMouseEnter={() => handleMouseEnter(boxName)}
        onMouseLeave={handleMouseLeave}
      />
      {hoveredBox === boxName && (
        <div
          className="absolute top-0 left-6 bg-white shadow-lg border rounded-lg p-3 w-64 text-sm"
          onMouseEnter={() => handleMouseEnter(boxName)}
          onMouseLeave={handleMouseLeave}
        >
          {content}
        </div>
      )}
    </div>
  );

  return (
    <div className="justify-center flex flex-col w-full">
      <h1 className="text-3xl font-bold justify-center flex">Hva vil du gjøre på eiendommen din?</h1>
      
      <div className='w-full min-h-28 mt-4 p-4 border-2 border-gray-400 rounded-lg space-y-4'>
        <h2 className="font-medium inline-flex">
          Kryss av for endringene du vil gjøre:
          <InfoTooltip 
            boxName="checkboxChanges" 
            content="Her kan du krysse av for endringene du planlegger å gjøre på eiendommen din." 
          />
        </h2>

        <RadioField 
          name="internalStaircase" 
          label="Skal du sette inn innvendig trapp?" 
          value={formData.internalStaircase}
        />

        <RadioField 
          name="bearingWallsorConstructions" 
          label="Skal du endre på bærende vegg(er) eller bærende konstruksjoner?" 
          value={formData.bearingWallsorConstructions}
        />

        <RadioField 
          name="insertOrRemoveWindowOrDoor" 
          label="Skal du sette inn eller fjerne vindu eller dør i yttervegg?" 
          value={formData.insertOrRemoveWindowOrDoor}
        />

        <RadioField 
          name="otherPhysicalChanges" 
          label="Skal du gjøre andre fysiske endringer av rommet/rommene?" 
          value={formData.otherPhysicalChanges}
        />
      </div>

      <div className='border-2 border-gray-400 rounded-lg mt-4 p-4'>
        <h2 className="font-medium inline-flex">
          Beskrivelse
          <InfoTooltip 
            boxName="description" 
            content="Her kan du gi en detaljert beskrivelse av tiltaket du planlegger å gjennomføre." 
          />
        </h2>
      
        <textarea
          name="description"
          className="w-full min-h-28 mt-2 p-4 text-md border-2 border-gray-300 rounded-lg"
          placeholder="Skriv her ..."
          value={formData.description}
          onChange={(e) => handleFieldChange(e.target.name, e.target.value)}
          required
        />
      </div>
      
      <div className='w-full h-fit mt-4 p-4 border-2 border-gray-400 rounded-lg'>
        <h2 className='font-medium mb-2'>Trenger du dispensasjon eller andre tilltatelser?</h2>

        <div className='gap-4 flex flex-wrap'>
          <CheckboxField 
            name="yesDispensationIsAttached" 
            label="Ja, men jeg har ikke søkt" 
          />

          <CheckboxField 
            name="yesPermitsAreAttached" 
            label="Ja, jeg har søknad/tillatelse/vedtak" 
          />

          <CheckboxField 
            name="noDispensationNeeded" 
            label="Nei, jeg trenger ikke" 
          />
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
      
      {isSaving && (
        <div className="fixed bottom-4 right-4 bg-white shadow-md rounded-full p-2 z-10">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  )
}

export default BruksendreStep1_0