import React, { useEffect } from 'react';
import { ApplicationService, UIComponents } from '~/utils/api-service';
import { Tooltip, RadioGroup } from '~/components/ui/ui-components';

// Update FormDataType to match our schema change
type FormDataType = {
  neighboringBorder: string;
  powerLine: string;
  dangerZone: string;
  protectedBuilding: string;
  drivewayChanges: string;
  road_type: string; 
};

// Define default values to ensure controls are always controlled
const defaultValues: FormDataType = {
  neighboringBorder: '',
  powerLine: 'Nei',
  dangerZone: 'Nei',
  protectedBuilding: 'Nei',
  drivewayChanges: 'Nei',
  road_type: '',
};

// Road type options
const ROAD_TYPES = {
  RIKSVEI: "riksvei_eller_fylkesvei",
  KOMMUNAL: "kommunal_vei",
  PRIVAT: "privat_vei"
};

interface BruksendreStep1_1Props {
  applicationID: number;
  formData: FormDataType;
  setFormData: React.Dispatch<React.SetStateAction<FormDataType>>;
  onValidityChange: (isValid: boolean) => void;
}

const BruksendreStep1_1: React.FC<BruksendreStep1_1Props> = ({ 
  applicationID, 
  formData: externalFormData, 
  setFormData: externalSetFormData, 
  onValidityChange 
}) => {
  // Merge with defaults to ensure all properties are defined
  const formData = { ...defaultValues, ...externalFormData };
  
  const tooltip = UIComponents.useTooltip();
  
  // Use the bruksendring application type specifically
  const { saveField, isSaving } = ApplicationService.useSaveFormData(applicationID, 'bruksendring');
  
  // Form validation function
  const checkFormValidity = (data: typeof formData) => {
    const basicFieldsValid = 
      (data.neighboringBorder?.trim() ?? '') !== '' &&
      (data.dangerZone?.trim() ?? '') !== '' &&
      (data.protectedBuilding?.trim() ?? '') !== '' &&
      (data.drivewayChanges === "Ja" || data.drivewayChanges === "Nei") &&
      (data.powerLine?.trim() ?? '') !== '';

    // Validate road_type only if driveway changes are planned
    const drivewayValid = data.drivewayChanges === "Nei" || data.road_type !== '';

    const isValid = basicFieldsValid && drivewayValid;
    onValidityChange(isValid);
    return isValid;
  };

  // Single unified handler for all field changes
  const handleFieldChange = (name: string, value: string | boolean) => {
    // Create the updated data
    const updatedFormData = { 
      ...formData, 
      [name]: value 
    };
    
    // Update parent component state
    externalSetFormData(prev => ({...prev, [name]: value}));
    
    // Check validity with the updated data
    checkFormValidity(updatedFormData);
    
    // Debug field name
    console.log(`Saving field: ${name} with value: ${value}`);
    
    // Save to API
    saveField(name, value.toString());
  };

  // Event handlers for form elements - simplified to use the unified handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    handleFieldChange(e.target.name, e.target.value);
  };

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFieldChange(e.target.name, e.target.value);
  };

  // Common tooltip content
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

  // Validate form on mount
  useEffect(() => {
    checkFormValidity(formData);
  }, []);

  return (
    <div className="justify-center flex flex-col w-full">
      <h1 className="text-3xl font-bold justify-center flex">Detaljer til det du vil gjøre</h1>

      {/* Distance Information Section */}
      <section className="border-2 border-gray-400 rounded-lg mt-4 p-4">
        <div className="flex flex-col md:flex-row">
          <div className="w-full md:w-3/6 h-72">
            <h2 className="inline-flex font-medium">
              Korteste avstand
              <Tooltip
                id="shortestDistance"
                content={tooltips.shortestDistance}
                isVisible={tooltip.isVisible('shortestDistance')}
                onMouseEnter={tooltip.handleMouseEnter}
                onMouseLeave={tooltip.handleMouseLeave}
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

          <div className="w-full md:w-3/6 md:border-l-2 md:border-gray-400 md:pl-8">
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
            isVisible={tooltip.isVisible('conflictsWithSurroundings')}
            onMouseEnter={tooltip.handleMouseEnter}
            onMouseLeave={tooltip.handleMouseLeave}
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

      {/* Driveway Section - Updated */}
      <section className='border-2 border-gray-400 rounded-lg mt-4 p-4'>
        <h2 className="font-medium inline-flex mb-2">
          Vil byggeprosjektet føre til en ny/endret avkjøring til eiendommen?
          <Tooltip
            id="driveway"
            content={tooltips.driveway}
            isVisible={tooltip.isVisible('driveway')}
            onMouseEnter={tooltip.handleMouseEnter}
            onMouseLeave={tooltip.handleMouseLeave}
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
              Eiendommen vil få ny/endret avkjørsel til (velg én):
            </h1>
            <div className='ml-8 mt-2 flex flex-col gap-2'>
              {[
                { value: ROAD_TYPES.RIKSVEI, label: "Riksvei eller fylkesvei" },
                { value: ROAD_TYPES.KOMMUNAL, label: "Kommunal vei" },
                { value: ROAD_TYPES.PRIVAT, label: "Privat vei" }
              ].map((option) => (
                <label key={option.value} className='items-center gap-x-2 flex'>
                  <input 
                    type="radio" 
                    name="road_type"
                    value={option.value}
                    checked={formData.road_type === option.value}
                    onChange={handleRadioChange}
                  />
                  {option.label}
                </label>
              ))}
            </div>
            <p className='mt-4 italic'>
              Du vil få muligheten til å legge til vedlegg som viser at du har avkjøringstillatelse fra
              Statens vegvesen eller kommunen, eller/og veirett gjennom tinglyst erklæring i senere steg.
            </p>
          </div>
        )}
      </section>

      {/* Show saving indicator */}
      {isSaving && (
        <div className="fixed bottom-4 right-4 bg-white shadow-md rounded-full p-2 z-10">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
};

export default BruksendreStep1_1;