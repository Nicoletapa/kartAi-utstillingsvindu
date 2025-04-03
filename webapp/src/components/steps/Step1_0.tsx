import React, { useState } from 'react'
import { Info } from 'lucide-react';
import { ApplicationService, UIComponents } from '~/utils/api-service';
import { resolveFieldPath } from '~/utils/field-mappings';

interface Step1_0Props {
  applicationID: number;
  formData: {
    municipalPlan: boolean;
    regulationPlan: boolean;
    regulationPlanDetails: string;
    otherPlans: boolean;
    otherPlansDetails: string;
    yesDispensationIsAttached: boolean;
    yesPermitsAreAttached: boolean;
    noDispensationNeeded: boolean;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
      municipalPlan: boolean;
      regulationPlan: boolean;
      regulationPlanDetails: string;
      otherPlans: boolean;
      otherPlansDetails: string;
      yesDispensationIsAttached: boolean;
      yesPermitsAreAttached: boolean;
      noDispensationNeeded: boolean;
    }>>;
    onValidityChange: (isValid: boolean) => void;
}

const Step1_0: React.FC<Step1_0Props> = ({ applicationID, formData,  setFormData: externalSetFormData,
   onValidityChange }) => {
    const { saveField, isSaving } = ApplicationService.useSaveFormData(applicationID, 'sma-prosjekter');
    const [hoveredBox, setHoveredBox] = useState<string | null>(null);
    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
    
  
    const safeFormData = {
        ...formData,
        regulationPlanDetails: formData.regulationPlanDetails || '',
        otherPlansDetails: formData.otherPlansDetails || ''
    };

    const handleMouseEnter = (box: string) => {
      if (timeoutId) clearTimeout(timeoutId);
      setHoveredBox(box);
    };
  
    const handleMouseLeave = () => {
      const id = setTimeout(() => setHoveredBox(null), 300);
      setTimeoutId(id);
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFieldChange(e.target.name, e.target.value);
      };
    

      const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        handleFieldChange(e.target.name, e.target.value);
      };

    const checkFormValidity = (data: typeof safeFormData) => {
        const basicsFieldValid = 
          (data.municipalPlan) ||
          (data.otherPlans && data.otherPlansDetails.trim() !== '') ||
          (data.regulationPlan && data.regulationPlanDetails.trim() !== '');

          const dispensationOrOtherPermits = 
          data.yesDispensationIsAttached || 
          data.yesPermitsAreAttached || 
          data.noDispensationNeeded;
    
        const isValid = basicsFieldValid && dispensationOrOtherPermits;
        onValidityChange(isValid);
    };

      const handleFieldChange = (name: string, value: string | boolean | string[]) => {
        const updatedFormData = {
          ...formData,
          [name]: value,
        };
    
        externalSetFormData((prev) => ({ ...prev, [name]: value }));
        checkFormValidity(updatedFormData);
    
        console.log(`Saving field: ${name} with value:`, value);
    
        // Get the mapped field path for saving to the backend
        const fieldPath = resolveFieldPath(name, 'sma-prosjekter');
        
        // Save using the resolved field path
        if (Array.isArray(value)) {
          saveField(fieldPath, JSON.stringify(value));
        } else {
          saveField(fieldPath, value.toString());
        }
      };
    

  return (
    <div className='justify-center flex flex-col w-full'>
      <h1 className="text-3xl font-bold justify-center flex">Planer & Regelverk</h1>
      <div className='border-2 border-gray-400 rounded-lg mt-4 h-80'>
          [kommunekart]
      </div>
      <div className='border-2 border-gray-400 rounded-lg mt-4 p-4'>
        <h1 className='font-medium inline-flex'>Hvilke kommunale planer gjelder for din eiendom?
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
        </h1>
          <p>Du kan bestille disse fra kommunen, eller finne dem på kommunens nettside. <br />Flere kryss kan være nødvendig:</p>
        <div className='ml-8 mt-2 flex flex-col gap-4'>
            <label className='flex items-center gap-x-2 h-8'>
                <input 
                    type="checkbox" 
                    name='municipalPlan'
                    checked={safeFormData.municipalPlan}
                    onChange={handleCheckboxChange}
                    className="w-4 h-4"
                />
                <span>Kommuneplan</span>
            </label>
            
            <div className="flex items-center gap-x-2">
                <label className='flex items-center gap-x-2 h-8'>
                    <input 
                        type="checkbox" 
                        name='regulationPlan'
                        checked={safeFormData.regulationPlan}
                        onChange={handleCheckboxChange}
                        className="w-4 h-4"
                    />
                    <span className="w-32">Reguleringsplan</span>
                </label>
                    <input
                        type="text"
                        name="regulationPlanDetails"
                        value={safeFormData.regulationPlanDetails}
                        onChange={handleInputChange}
                        placeholder="Navn/nummer på plan"
                        className="px-2 py-1 border rounded text-sm w-64"
                        required
                    />
            </div>
            
            <div className="flex items-center gap-x-2">
                <label className='flex items-center gap-x-2 h-8'>
                    <input 
                        type="checkbox" 
                        name='otherPlans'
                        checked={safeFormData.otherPlans}
                        onChange={handleCheckboxChange}
                        className="w-4 h-4"
                    />
                    <span className="w-32">Andre planer</span>
                </label>
                    <input
                        type="text"
                        name="otherPlansDetails"
                        value={safeFormData.otherPlansDetails}
                        onChange={handleInputChange}
                        placeholder="Navn/nummer på pan"
                        className="px-2 py-1 border rounded text-sm w-64"
                        required
                    />
            </div>
        </div>
        
        </div>
      <div className='w-full h-fit mt-2 p-4 border-2 border-gray-400 rounded-lg'>
        <h2 className='font-medium mb-2'>Trenger du dispensasjon eller andre tilltatelser?</h2>
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
      {isSaving && (
        <div className="fixed bottom-4 right-4 bg-white shadow-md rounded-full p-2 z-10">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      </div>
  )
}


export default Step1_0