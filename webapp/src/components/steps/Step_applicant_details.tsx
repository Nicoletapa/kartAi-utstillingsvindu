import React, { useState, useEffect } from 'react';
import { api } from "~/trpc/react";
import { toast } from "react-hot-toast";
import { useSession } from "next-auth/react";
import { useFormContext } from "~/context/FormContext";
import type { FormDataType } from "~/context/FormContext";
import { Button } from '../ui/button';
import { ArrowRight, ArrowLeft, Info } from 'lucide-react';
import { useRouter } from "next/navigation";
import { ApplicationService, UIComponents, FormService } from '~/utils/api-service';
import { Loader2 } from 'lucide-react';

// Types
interface StepApplicantDetailsProps {
  applicationID?: number;
  onValidityChange: (isValid: boolean) => void;
}

interface Property {
  id: string;
  address: string;
}

interface FieldDisplay {
  label: string;
  value: string;
}

// Move this outside the component or memoize it
const checkFormValidity = (data: FormDataType) => {
  const safeString = (value: string | undefined | null): string => 
    (value === undefined || value === null) ? '' : String(value).trim();
  
  return !!safeString(data.applicant.name) && 
         !!safeString(data.applicant.email) &&
         !!safeString(data.property.address) &&
         !!safeString(data.property.property_number) &&
         !!safeString(data.property.usage_number);
};

const Step_applicant_details: React.FC<StepApplicantDetailsProps> = ({ 
  applicationID, 
  onValidityChange
}) => {
  // Add this state to track validity internally
  const [isFormValid, setIsFormValid] = useState(false);

  // Context and navigation hooks
  const { applicantFormData, updateApplicantFormData } = useFormContext();
  const router = useRouter();
  const { data: session } = useSession();
  const tooltip = UIComponents.useTooltip();
  
  // Form validation

  // Replace your custom form state with FormService
  const { 
    formData, 
    setFormData, 
    isDirty, 
    setIsDirty, 
    handleInputChange 
  } = FormService.useForm<FormDataType>(
    applicantFormData,
    checkFormValidity
  );
  
  // Replace manual save state with ApplicationService
  const { saveField, isSaving } = ApplicationService.useSaveFormData(
    applicationID ?? 0, 
    'sma-prosjekter', // Or whatever application type is appropriate
    1000
  );
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  
  // API queries
  const { 
    data: application, 
    isLoading: isLoadingApplication 
  } = ApplicationService.getApplication(applicationID ?? 0);
  
  const { 
    data: userDetails, 
    isLoading: isLoadingUserDetails 
  } = api.user.getUserDetails.useQuery(
    undefined,
    { enabled: !!session }
  );

  // Form validation

  // Load data from application
  useEffect(() => {
    if (!application?.application_fields || 
        formData.applicant.name || 
        formData.property.address || 
        formData.property.property_number) {
      return;
    }
    
    const fieldsMap: Record<string, string> = {};
    application.application_fields.forEach(field => {
      fieldsMap[field.fieldName] = field.fieldValue;
    });
    
    const newFormData: FormDataType = {
      applicant: {
        name: fieldsMap['applicant.name'] ?? '',
        email: fieldsMap['applicant.email'] ?? '',
        phone: fieldsMap['applicant.phone'] ?? '',
      },
      property: {
        address: fieldsMap['property.address'] ?? '',
        property_number: fieldsMap['property.property_number'] ?? '',
        usage_number: fieldsMap['property.usage_number'] ?? '',
        lease_number: fieldsMap['property.lease_number'] ?? '',
        section_number: fieldsMap['property.section_number'] ?? '',
        postal_code: fieldsMap['property.postal_code'] ?? '',
        municipality: fieldsMap['property.municipality'] ?? '',
      }
    };
    
    setFormData(newFormData);
    checkFormValidity(newFormData);
  }, [application]);

// In your component, use this effect instead:
useEffect(() => {
  const isValid = checkFormValidity(formData);
  setIsFormValid(isValid);
  onValidityChange(isValid);
}, [formData, onValidityChange]); // Only run when formData changes

  // Property selection handler
  const handlePropertyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const propertyId = e.target.value;
    setSelectedPropertyId(propertyId);
    
    const selectedProperty = properties.find(p => p.id === propertyId);
    if (selectedProperty) {
      setFormData(prev => ({
        ...prev,
        property: {
          ...prev.property,
          address: selectedProperty.address,
        }
      }));
    }
  };

  // Save all form data at once - for navigation or other bulk saves
  const saveAllFormData = async () => {
    if (!applicationID) return false;
    
    try {
      // Create array of fields to save
      const fields = [
        // Applicant fields
        { name: 'applicant.name', value: formData.applicant.name ?? '' },
        { name: 'applicant.email', value: formData.applicant.email ?? '' },
        { name: 'applicant.phone', value: formData.applicant.phone ?? '' },
        
        // Property fields
        { name: 'property.address', value: formData.property.address ?? '' },
        { name: 'property.property_number', value: formData.property.property_number ?? '' },
        { name: 'property.usage_number', value: formData.property.usage_number ?? '' },
        { name: 'property.lease_number', value: formData.property.lease_number ?? '' },
        { name: 'property.section_number', value: formData.property.section_number ?? '' },
        { name: 'property.postal_code', value: formData.property.postal_code ?? '' },
        { name: 'property.municipality', value: formData.property.municipality ?? '' },
      ];
      
      // Use individual saveField calls for each field
      await Promise.all(
        fields.map(field => saveField(field.name, field.value))
      );
      
      setIsDirty(false);
      return true;
    } catch (error) {
      console.error('Error saving form data:', error);
      toast.error("Feil ved lagring av skjemadata");
      return false;
    }
  };

  // Navigation handlers
  const handleNext = async () => {
    if (isDirty) {
      await saveAllFormData();
    }
    
    if (applicationID) {
      router.push(`/atlas-app/i-soknad/${applicationID}/hva-vil-du-gjore`); 
    }
  };

  const handleBack = () => {
    if (applicationID) {
      router.push(`/atlas-app/i-soknad/${applicationID}`);
    } else {
      router.push('/atlas-app/i-soknad');
    }
  };

  // Sync with context
  useEffect(() => {
    updateApplicantFormData(formData);
  }, [formData, updateApplicantFormData]);

  // Load user properties
  useEffect(() => {
    if (userDetails) {
      setProperties([
        { id: '1', address: userDetails.address ?? 'Hovedgata 1, 0123 Oslo' }
      ]);
    }
  }, [userDetails]);
  
  // Auto-fill form with user data
  useEffect(() => {
    if (!userDetails || isDirty) return;
    
    // Only auto-fill if all fields are empty
    const shouldAutoFill = 
      !formData.applicant.name && 
      !formData.applicant.email && 
      !formData.property.address;
  
    if (shouldAutoFill) {
      setFormData(prev => ({
        applicant: {
          name: userDetails.name ?? prev.applicant.name ?? '',
          email: userDetails.email ?? prev.applicant.email ?? '',
          phone: userDetails.phone ?? prev.applicant.phone ?? '',
        },
        property: {
          ...prev.property,
          address: userDetails.address ?? prev.property.address ?? '',
          property_number: userDetails.gnr?.toString() ?? prev.property.property_number ?? '',
          usage_number: userDetails.bnr?.toString() ?? prev.property.usage_number ?? '',
          postal_code: userDetails.postalCode ?? prev.property.postal_code ?? '',
          municipality: userDetails.postalArea ?? prev.property.municipality ?? '',
        }
      }));
    }
  }, [userDetails, isDirty]); // Remove formData fields from dependencies

  // Load data from application
  useEffect(() => {
    if (!application?.application_fields) return;
  
    setFormData(prev => {
      const fieldsMap: Record<string, string> = {};
      application.application_fields.forEach(field => {
        fieldsMap[field.fieldName] = field.fieldValue;
      });
      
      return {
        applicant: {
          name: fieldsMap['applicant.name'] ?? prev.applicant.name ?? '',
          email: fieldsMap['applicant.email'] ?? prev.applicant.email ?? '',
          phone: fieldsMap['applicant.phone'] ?? prev.applicant.phone ?? '',
        },
        property: {
          ...prev.property,
          address: fieldsMap['property.address'] ?? prev.property.address ?? '',
          property_number: fieldsMap['property.property_number'] ?? prev.property.property_number ?? '',
          usage_number: fieldsMap['property.usage_number'] ?? prev.property.usage_number ?? '',
          lease_number: fieldsMap['property.lease_number'] ?? prev.property.lease_number ?? '',
          section_number: fieldsMap['property.section_number'] ?? prev.property.section_number ?? '',
          postal_code: fieldsMap['property.postal_code'] ?? prev.property.postal_code ?? '',
          municipality: fieldsMap['property.municipality'] ?? prev.property.municipality ?? '',
        }
      };
    });
  }, [application]); // Only run when application changes

  // Auto-save when isDirty, using debounced saveField from the service
  useEffect(() => {
    if (!isDirty || !applicationID) return;
    
    // Don't need to implement auto-save here, as each field change will trigger saveField
    // from FormService's handleInputChange method
    // This is already handled by the ApplicationService.useSaveFormData hook
  }, [isDirty, applicationID]);

  // Prepare display data
  const personalData: FieldDisplay[] = [
    { label: "Navn:", value: formData.applicant.name ?? 'Ikke angitt' },
    { label: "E-post:", value: formData.applicant.email ?? 'Ikke angitt' },
    { label: "Telefon:", value: formData.applicant.phone ?? 'Ikke angitt' },
  ];

  const propertyData: FieldDisplay[] = [
    { label: "Adresse:", value: formData.property.address ?? 'Ikke angitt' },
    { label: "Gårdsnr.:", value: formData.property.property_number ?? 'Ikke angitt' },
    { label: "Bruksnr.:", value: formData.property.usage_number ?? 'Ikke angitt' },
    { label: "Festenr.:", value: formData.property.lease_number ?? 'Ikke angitt' },
    { label: "Seksjonsnr.:", value: formData.property.section_number ?? 'Ikke angitt' },
  ];

  const ownerData: FieldDisplay[] = [
    { label: "Telefon:", value: userDetails?.phone ?? 'Ikke angitt' },
    { label: "E-post:", value: userDetails?.email ?? 'Ikke angitt' },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full mt-16">
      {(isLoadingApplication && applicationID) || isLoadingUserDetails ? (
        <LoadingIndicator />
      ) : (
        <>
          <h1 className="text-3xl font-bold justify-center flex">Dine opplysninger</h1>

          <div className="border-2 border-gray-400 rounded-lg mt-4 p-4 lg:w-[950px]" data-cy="main-container">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="w-full md:w-2/6" data-cy="left-column">
                <h1 className='font-medium mb-4'>Personopplysninger</h1>
                <DisplayFields fields={personalData} />
              </div>

              <div className="w-full md:w-4/6 md:border-l-2 md:border-gray-400 md:pl-8" data-cy="right-column">
                <div className='mb-4'>
                  <h1 className='font-medium inline-flex'>
                    Eiendom
                    <div className="relative flex">
                      <Info
                        size={14}
                        className="ml-1 hover:cursor-pointer"
                        onMouseEnter={() => tooltip.handleMouseEnter('eiendom')}
                        onMouseLeave={tooltip.handleMouseLeave}
                      />
                      {tooltip.isVisible('eiendom') && (
                        <div
                          className="absolute top-0 left-6 bg-white shadow-lg border rounded-lg p-3 w-64 text-sm z-10"
                          onMouseEnter={() => tooltip.handleMouseEnter('eiendom')}
                          onMouseLeave={tooltip.handleMouseLeave}
                        >
                          Velg eiendommen du vil gjøre en endring på.
                        </div>
                      )}
                    </div>
                  </h1>
                </div>

                <div className='flex flex-col space-y-2 mt-2'>
                  <select 
                    name="velgEiendom" 
                    id="velgEiendom" 
                    value={selectedPropertyId ?? ''}
                    onChange={handlePropertyChange}
                    className='bg-gray-200 border-2 border-gray-300 focus:outline-none focus:ring rounded-md mb-2 p-2'
                  >
                    <option value="">Velg eiendom</option>
                    {properties.map(property => (
                      <option key={property.id} value={property.id}>{property.address}</option>
                    ))}
                  </select>

                  <h1 className='font-medium'>Eiendomsinformasjon</h1>
                  
                  <div className="flex flex-col md:flex-row md:gap-8 w-full">
                    <div className="flex-1 space-y-2">
                      <DisplayFields fields={propertyData} />
                    </div>

                    <div className="flex-1 space-y-2">
                      <h1 className='font-medium'>Eies av:</h1>
                      <div>
                        {userDetails?.name ?? 'Ikke angitt'}
                      </div>
                      <DisplayFields fields={ownerData} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <NavigationButtons 
            onBack={handleBack}
            onNext={handleNext}
            isSaving={isSaving}
          />
        </>
      )}
    </div>
  );
};

const LoadingIndicator: React.FC = () => (
  <div className="flex justify-center items-center h-full">
        <Loader2 className="animate-spin text-gray-500" size={24} />
        <span className="ml-3">Laster data...</span>
  </div>
);

const DisplayFields: React.FC<{ fields: FieldDisplay[] }> = ({ fields }) => (
  <div className="space-y-2">
    {fields.map((field, index) => (
      <div key={index} className="flex">
        <p className="font-medium mr-1">{field.label}</p>
        <span>{field.value}</span>
      </div>
    ))}
  </div>
);

const NavigationButtons: React.FC<{
  onBack: () => void;
  onNext: () => void;
  isSaving: boolean;
}> = ({ onBack, onNext, isSaving }) => (
  <div className="mt-5 w-full flex justify-center gap-4">
    <Button 
      onClick={onBack} 
      className="border-2 bg-white text-gray-500 border-gray-500 hover:bg-gray-500 hover:text-white w-44"
    >
      <ArrowLeft size={18} className="mr-2" />
      <span className="relative inline-block">Tilbake</span>
    </Button>

    <Button 
      onClick={onNext}
      className="border-2 text-kartAI-blue bg-white border-kartAI-blue hover:text-white hover:bg-kartAI-blue w-44"
    >
      {isSaving ? (
        <Loader2 className="animate-spin text-gray-500" size={24} />
      ) : null}
      <span className="relative inline-block">
        Neste
      </span>
      <ArrowRight size={18} className="ml-2" />    
    </Button>
  </div>
);

export default Step_applicant_details;