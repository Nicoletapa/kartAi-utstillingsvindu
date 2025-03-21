"use client";
import { 
  getSchemaForApplicationType,
  getFieldsForApplicationType
} from "~/utils/applicationForm";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { get } from "lodash";
import { api } from "~/trpc/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { ApplicationType } from "@prisma/client";
import { ProgressBar } from "./Progressbar";
import { ArrowLeft, ArrowRight, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { useSession } from "next-auth/react";
import { APPLICATION_TYPE_DISPLAY_NAMES } from "~/utils/applicationTypes";

// Define a type for simplified user information
type SimplifiedUser = {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    id: string;
    address?: string | null;
    property_number?: string | null;
    usage_number?: string | null;
    lease_number?: string | null;
    section_number?: string | null;
    postal_code?: string | null;
    municipality?: string | null;
};

type FieldProps = {
    title: string;
    type: string;
    name: string; 
};

type TemplateProps = {
    template?: {
        title: string;
        fields?: FieldProps[];
    };
    applicationType?: ApplicationType;
    applicationID?: number;
    isNewApplication?: boolean;
    onTypeSelect?: (type: ApplicationType) => void;
};

// Group fields into logical steps
const groupFieldsIntoSteps = (fields: FieldProps[]) => {
  // Get section name from field name
  const getSectionName = (fieldName: string) => {
    const parts = fieldName.split('.');
    if (parts.length >= 2) {
      return parts[1];
    }
    return 'other';
  };

  // Define step structure based on sections
  const stepStructure = [
    { title: "Oversikt", sections: ['application_types', 'beskrivelse_av_endring', 'property_details', 'eiendom'] },
    { title: "Dokumentsjekk", sections: ['endringer', 'dispensasjon'] },
    { title: "Nabovarsel", sections: ['avstander', 'konflikter'] },
    { title: "Søknaden", sections: ['applicant_details', 'soeker', 'avkjoring'] },
    { title: "Vedlegg", sections: ['vedlegg', 'attachments'] },
    { title: "Innsending", sections: ['underskrift'] },
  ];

  // Group fields by section first
  const sectionGroups: Record<string, FieldProps[]> = {};
  fields.forEach(field => {
    const sectionName = getSectionName(field.name);
    if (!sectionGroups[sectionName]) {
      sectionGroups[sectionName] = [];
    }
    sectionGroups[sectionName].push(field);
  });

  // Now group sections into steps
  return stepStructure.map(step => {
    const stepFields: FieldProps[] = [];
    step.sections.forEach(section => {
      if (sectionGroups[section]) {
        stepFields.push(...sectionGroups[section]);
      }
    });
    return {
      title: step.title,
      fields: stepFields
    };
  }).filter(step => step.fields.length > 0); // Only include steps with fields
};

export function ApplicationTemplate({ 
  template, 
  applicationType, 
  applicationID,
  isNewApplication,
  onTypeSelect
}: TemplateProps) {
    const router = useRouter();
    const { data: session } = useSession();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [isStepValid, setIsStepValid] = useState(false);
    const [selectedType, setSelectedType] = useState<ApplicationType | undefined>(applicationType);
  
    // Convert session user to simplified user type
    const simplifiedUser: SimplifiedUser | undefined = session?.user 
      ? {
          name: session.user.name || '',
          email: session.user.email || '',
          phone: session.user.phone || '',
          id: session.user.id,
          address: session.user.address || '',
          property_number: String(session.user.gnr || ''),
          usage_number: String(session.user.bnr || ''),    
          lease_number: String(session.user.fnr || ''),    
          section_number: String(session.user.snr || ''),  
          postal_code: session.user.postalCode || '',
          municipality: session.user.postalArea || '',
        }
      : undefined;

    // Get the correct schema and default values based on application type (now with simplified user data)
    const { schema, defaultValues } = getSchemaForApplicationType(
        applicationType, 
        simplifiedUser
    );
    
    // Use the fields from the template or generate them based on the application type
    const allFields = template?.fields || getFieldsForApplicationType(applicationType);
    
    // Group fields into steps
    const steps = groupFieldsIntoSteps(allFields);
    
    
    const { register, handleSubmit, watch, formState: { errors } } = useForm({
        mode: "all",
        resolver: zodResolver(schema),
        defaultValues: defaultValues
    });

    // Watch form values for validation
    const watchedValues = watch();
    
    // Check if current step is valid
    useEffect(() => {
      const currentStepFields = steps[currentStep]?.fields || [];
      const stepFieldNames = currentStepFields.map(field => field.name);
      
      // Check if any required field in current step is empty or has error
      const hasInvalidField = stepFieldNames.some(fieldName => {
        const fieldValue = get(watchedValues, fieldName);
        const fieldError = get(errors, fieldName);
        
        // Consider the field invalid if it's required and empty, or has validation error
        return (fieldValue === undefined || fieldValue === "" || fieldError);
      });
      
      setIsStepValid(!hasInvalidField);
    }, [watchedValues, errors, currentStep, steps]);
    
    // Create mutation hooks
    const addApplicationField = api.application.addApplicationField.useMutation();
    
    const renderField = (field: FieldProps) => {
        const { title, type, name } = field;
        
        const fieldError = get(errors, name);
        const errorMessage = fieldError?.message as string | undefined;
        
        // Special handling for user-related fields
        const isUserField = name.includes('.applicant_details.') || name.includes('.soeker.');
        const isAutoFilled = isUserField && session?.user;
        
       
        switch (type) {
            case "textarea":
                return (
                    <div key={name} className="mb-4">
                        <label className="block mb-1 font-medium">{title}</label>
                        <textarea
                            {...register(name as any)} 
                            className={`w-full min-h-28 p-4 text-md border-2 rounded-lg ${fieldError ? "border-red-500" : "border-gray-400"}`}
                            placeholder="Skriv her ..."
                            rows={4}
                        />
                        {fieldError && (
                            <p className="text-red-500 text-sm mt-1">{errorMessage}</p>
                        )}
                    </div>
                );
                
            case "radio":
                return (
                    <div key={name} className="mb-4">
                        <p className="block mb-1 font-medium">{title}</p>
                        <div className="flex space-x-4">
                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    {...register(name as any)}
                                    value="Ja"
                                    className="mr-2"
                                />
                                Ja
                            </label>
                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    {...register(name as any)}
                                    value="Nei"
                                    className="mr-2"
                                />
                                Nei
                            </label>
                        </div>
                        {fieldError && (
                            <p className="text-red-500 text-sm mt-1">{errorMessage}</p>
                        )}
                    </div>
                );
                
            case "select":
                // For dispensasjon
                if (name.includes('.dispensasjon.trenger_disp')) {
                    return (
                        <div key={name} className="mb-4">
                            <label className="block mb-1 font-medium">{title}</label>
                            <select
                                {...register(name as any)} 
                                className={`w-full p-2 border-2 rounded-lg ${fieldError ? "border-red-500" : "border-gray-400"}`}
                            >
                                <option value="Nei, jeg trenger ikke">Nei, jeg trenger ikke</option>
                                <option value="Ja, søknad er vedlagt">Ja, søknad er vedlagt</option>
                                <option value="Ja, tillatelse er vedlagt">Ja, tillatelse er vedlagt</option>
                            </select>
                            {fieldError && (
                                <p className="text-red-500 text-sm mt-1">{errorMessage}</p>
                            )}
                        </div>
                    );
                }
                
                // For type_vei
                if (name.includes('.avkjoring.type_vei')) {
                    return (
                        <div key={name} className="mb-4">
                            <label className="block mb-1 font-medium">{title}</label>
                            <select
                                {...register(name as any)} 
                                className={`w-full p-2 border-2 rounded-lg ${fieldError ? "border-red-500" : "border-gray-400"}`}
                            >
                                <option value="Riksvei">Riksvei</option>
                                <option value="Fylkesvei">Fylkesvei</option>
                                <option value="Kommunal vei">Kommunal vei</option>
                                <option value="Privat vei">Privat vei</  option>                          
                                </select>
                            {fieldError && (
                                <p className="text-red-500 text-sm mt-1">{errorMessage}</p>
                            )}
                        </div>
                    );
                }
                
                return (
                    <div key={name} className="mb-4">
                        <label className="block mb-1 font-medium">{title}</label>
                        <select
                            {...register(name as any)} 
                            className={`w-full p-2 border-2 rounded-lg ${fieldError ? "border-red-500" : "border-gray-400"}`}
                        >
                            <option value="">Velg {title.toLowerCase()}</option>
                            <option value="option1">Option 1</option>
                            <option value="option2">Option 2</option>
                            <option value="option3">Option 3</option>
                        </select>
                        {fieldError && (
                            <p className="text-red-500 text-sm mt-1">{errorMessage}</p>
                        )}
                    </div>
                );
                
            default:
                // Add indication for auto-filled fields
                if (isAutoFilled) {
                    return (
                        <div key={name} className="mb-4">
                            <label className="block mb-1 font-medium">
                                {title}
                                <span className="text-xs text-blue-500 ml-2">(Auto-filled from your profile)</span>
                            </label>
                            <input 
                                type={type}
                                {...register(name as any)} 
                                className={`w-full p-2 text-sm border-b-2 ${fieldError ? "border-red-500" : "border-blue-400"} outline-none bg-blue-50`}
                                placeholder={`${title.toLowerCase()} (auto-filled)`}
                            />
                            {fieldError && (
                                <p className="text-red-500 text-sm mt-1">{errorMessage}</p>
                            )}
                        </div>
                    );
                }
                
                return (
                    <div key={name} className="mb-4">
                        <label className="block mb-1 font-medium">{title}</label>
                        <input 
                            type={type}
                            {...register(name as any)} 
                            className={`w-full p-2 text-sm border-b-2 ${fieldError ? "border-red-500" : "border-gray-400"} outline-none`}
                            placeholder={`Skriv ${title.toLowerCase()} her...`}
                        />
                        {fieldError && (
                            <p className="text-red-500 text-sm mt-1">{errorMessage}</p>
                        )}
                    </div>
                );
        }
    };
    
    // Group fields by their section for the current step
    const renderCurrentStep = () => {
        const currentStepFields = steps[currentStep]?.fields || [];
        
        // Helper function to get the section name from a field name
        const getSectionName = (fieldName: string) => {
            const parts = fieldName.split('.');
            if (parts.length >= 2) {
                return parts[1];
            }
            return 'other';
        };
        
        // Group fields by section
        const sections: Record<string, FieldProps[]> = {};
        currentStepFields.forEach(field => {
            const sectionName = getSectionName(field.name);
            if (!sections[sectionName]) {
                sections[sectionName] = [];
            }
            sections[sectionName].push(field);
        });
        
        // Map of section names to display names
        const sectionTitles: Record<string, string> = {
            'application_types': 'Søknadstype',
            'endringer': 'Endringer',
            'dispensasjon': 'Dispensasjon',
            'eiendom': 'Eiendom',
            'soeker': 'Søker',
            'property_details': 'Eiendomsdetaljer',
            'applicant_details': 'Søkerinformasjon',
            'beskrivelse_av_endring': 'Beskrivelse av Endring',
            'avstander': 'Avstander',
            'konflikter': 'Konflikter',
            'avkjoring': 'Avkjøring',
            'vedlegg': 'Vedlegg',
            'underskrift': 'Underskrift'
        };

        if (currentStepFields.length === 0) {
            return <div className="text-center py-10">Ingen felt å vise for dette steget</div>;
        }
        
        return (
            <div>
                <h1 className="text-3xl font-bold justify-center flex mb-6">{steps[currentStep]?.title || "Søknadsskjema"}</h1>
                
                {Object.entries(sections).map(([sectionName, sectionFields]) => (
                    <div key={sectionName} className="mb-8">
                        <h2 className="text-xl font-medium mb-4">{sectionTitles[sectionName] || sectionName}</h2>
                        <div className={sectionName === 'property_details' || sectionName === 'eiendom' ? "border-2 border-gray-400 rounded-lg p-4" : ""}>
                            {sectionFields.map(field => renderField(field))}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    // Process and flatten the form data for storage
    function flattenFormData(data: any): Record<string, string> {
        const result: Record<string, string> = {};
        
        function flatten(obj: any, prefix = '') {
            for (const [key, value] of Object.entries(obj)) {
                const newKey = prefix ? `${prefix}.${key}` : key;
                
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    flatten(value, newKey);
                } else if (Array.isArray(value)) {
                    result[newKey] = JSON.stringify(value);
                } else {
                    result[newKey] = String(value);
                }
            }
        }
        
        flatten(data);
        return result;
    }

    // Handle application type selection
    const handleTypeSelect = (type: ApplicationType) => {
      setSelectedType(type);
      setIsStepValid(true);
    };

    // If we're on the first step and creating a new application, show application type selection
    const renderApplicationTypeSelection = () => {
      return (
        <div>
          <h1 className="text-3xl font-bold justify-center flex mb-6">Choose Application Type</h1>
          <div className="space-y-4">
            {Object.entries(APPLICATION_TYPE_DISPLAY_NAMES).map(([type, displayName]) => (
              <div 
                key={type} 
                className={`flex items-center p-4 border rounded-md ${
                  selectedType === type ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => handleTypeSelect(type as ApplicationType)}
              >
                <input
                  type="radio"
                  id={type}
                  name="applicationType"
                  value={type}
                  checked={selectedType === type}
                  className="h-5 w-5 text-blue-600"
                  onChange={() => handleTypeSelect(type as ApplicationType)}
                />
                <label htmlFor={type} className="ml-3 cursor-pointer flex-1">
                  {displayName}
                </label>
              </div>
            ))}
          </div>
        </div>
      );
    };

    const handleNext = () => {
        // For new applications on the first step (type selection)
        if (currentStep === 0 && isNewApplication && selectedType && onTypeSelect) {
            onTypeSelect(selectedType);
            return;
        }
        
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            // On final step, submit the form
            handleSubmit(onSubmit)();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        } else {
            // On first step, confirm before exiting
            const confirmExit = window.confirm("Er du sikker på at du vil forlate siden?");
            if (confirmExit) {
                router.push("/atlas-app");
            }
        }
    };

    const onSubmit = async (data: any) => {
        try {
            setIsSubmitting(true);
            
            // Only proceed if an applicationID is provided
            if (!applicationID) {
                toast.error("No application ID provided. Please create an application first.");
                return;
            }
            
            // Ask for confirmation before submitting
            if (currentStep === steps.length - 1) {
                const confirmSend = window.confirm("Er du sikker på at du vil sende inn søknaden?");
                if (!confirmSend) {
                    setIsSubmitting(false);
                    return;
                }
            }
            
            // Flatten the form data
            const flattenedData = flattenFormData(data);
            
            // Save each field
            for (const [fieldName, fieldValue] of Object.entries(flattenedData)) {
                await addApplicationField.mutateAsync({
                    applicationID: applicationID,
                    fieldName,
                    fieldValue
                });
            }
            
            toast.success("Application saved successfully!");
            router.push(`/atlas-app/i-soknad/${applicationID}`);
            
        } catch (error) {
            console.error("Error submitting form:", error);
            toast.error("Failed to save application");
        } finally {
            setIsSubmitting(false);
        }
    };

    
    const progressSteps = steps.map((step, index) => ({
        title: step.title,
        isCompleted: index < currentStep,
        isActive: index === currentStep,
        substepsCompleted: 0,
        isLastStep: index === steps.length - 1,
        stepNumber: index + 1,
        isFirstStep: index === 0,
        totalSubsteps: 1
    }));

    const isButtonDisabled = !isStepValid;
    const isLastStep = currentStep === steps.length - 1;

    return (
        <div className="container mx-auto py-6 px-4 flex flex-col">
            <div className="mb-8 top-0 bg-background pt-4 pb-8 z-10">
                {/* Only show progress bar if we have an application type selected */}
                {selectedType && <ProgressBar steps={progressSteps} />}
            </div>

            <div className="flex space-x-8 flex-1">
                <div className="w-full">
                    <form className="space-y-4">
                        {currentStep === 0 && isNewApplication ? (
                            // Application type selection for new applications
                            renderApplicationTypeSelection()
                        ) : (
                            // Normal rendering for other steps
                            renderCurrentStep()
                        )}
                    </form>
                </div>
            </div>

            <div className="flex justify-between mt-8 gap-4">
                <Button onClick={handlePrev} className="border-2 bg-white text-gray-500 border-gray-500 hover:bg-gray-500 hover:text-white w-44">
                    <ArrowLeft size={18} className="mr-2" />
                    Tilbake
                </Button>
                <div className="flex items-center">
                    {isButtonDisabled && !isNewApplication && (
                        <div className="flex items-center mr-4 text-red-500 text-sm">
                            <AlertCircle size={16} className="mr-2 flex-shrink-0" /> 
                            <span>Alle felt må fylles ut før du kan gå videre</span>
                        </div>
                    )}
                    <Button 
                        onClick={handleNext}
                        disabled={isNewApplication && !selectedType}
                        className="border-2 bg-white text-kartAI-blue border-kartAI-blue hover:text-white hover:bg-kartAI-blue w-44"
                    >
                        {isLastStep ? "Send inn søknaden" : "Neste"}
                        <ArrowRight size={18} className="ml-2" />
                    </Button>
                </div>
            </div>
        </div>
    );
}