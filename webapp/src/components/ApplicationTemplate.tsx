"use client";
import { useState } from "react";
import { APPLICATION_TYPE_DISPLAY_NAMES, APPLICATION_SUBTYPES, SubType } from "~/utils/applicationTypes";
import { ApplicationType } from "@prisma/client";
import { ArrowLeft, ArrowRight, Info } from "lucide-react";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { toast } from "react-hot-toast";

type TemplateProps = {
    applicationType?: ApplicationType;
    isNewApplication?: boolean;
    onTypeSelect?: (type: ApplicationType, subType: string) => void;
};

// Helper function to get all subtypes flattened with their parent type
const getAllSubtypes = () => {
  const allSubtypes: Array<{parentType: ApplicationType, subType: SubType}> = [];
  
  Object.entries(APPLICATION_SUBTYPES).forEach(([parentType, subtypes]) => {
    subtypes.forEach(subtype => {
      allSubtypes.push({
        parentType: parentType as ApplicationType,
        subType: subtype
      });
    });
  });
  
  return allSubtypes;
};

export function ApplicationTemplate({ 

  isNewApplication}: TemplateProps) {
    const router = useRouter();
    const [selectedParentType, setSelectedParentType] = useState<ApplicationType | undefined>(undefined);
    const [selectedSubType, setSelectedSubType] = useState<string | undefined>(undefined);
    const [isCreating, setIsCreating] = useState(false);
    
    // Get all subtypes for display
    const allSubtypes = getAllSubtypes();
    
    // Setup application creation mutation
    const createApplication = api.application.createApplication.useMutation({
        onSuccess: (data) => {
            // Redirect to the application with the new ID
            router.push(`/atlas-app/i-soknad/${data.applicationID}`);
            toast.success("Søknad opprettet");
            setIsCreating(false);
        },
        onError: (error) => {
            toast.error(`Feil ved oppretting av søknad: ${error.message}`);
            setIsCreating(false);
        }
    });
    
    // Handle subtype selection (which also sets parent type)
    const handleSubTypeSelect = (parentType: ApplicationType, subTypeId: string) => {
      // Make sure parentType is a string value
      const typeValue = typeof parentType === 'string' ? 
        parentType : 
        String(parentType);
        
      setSelectedParentType(typeValue as ApplicationType);
      setSelectedSubType(subTypeId);
    };

    // Render application subtypes selection UI
    const renderSubtypeSelection = () => {
      return (
        <div>
          <h1 className="text-3xl font-bold justify-center flex mb-6">Velg søknadstype</h1>
          <p className="mb-6 text-center text-gray-600">
            Velg hvilken type søknad du vil sende inn basert på ditt prosjekt.
          </p>
          
          <div className="space-y-4">
            {allSubtypes.map(({ parentType, subType }) => (
              <div 
                key={`${parentType}-${subType.id}`} 
                className={`flex items-center p-5 border rounded-md transition-all ${
                  selectedParentType === parentType && selectedSubType === subType.id
                    ? 'border-blue-500 bg-blue-50 shadow-sm' 
                    : 'hover:bg-gray-50 border-gray-200'
                }`}
                onClick={() => handleSubTypeSelect(parentType, subType.id)}
              >
                <input
                  type="radio"
                  id={`${parentType}-${subType.id}`}
                  name="applicationType"
                  checked={selectedParentType === parentType && selectedSubType === subType.id}
                  className="h-5 w-5 text-blue-600"
                  onChange={() => handleSubTypeSelect(parentType, subType.id)}
                />
                <label htmlFor={`${parentType}-${subType.id}`} className="ml-3 cursor-pointer flex-1">
                  <div className="font-medium">{subType.name}</div>
                  <div className="text-sm text-gray-600 mb-1">
                    {APPLICATION_TYPE_DISPLAY_NAMES[parentType]}
                  </div>
                  <div className="text-sm text-gray-500">
                    {subType.description}
                  </div>
                </label>
                <div className="relative">
                  <Info 
                    size={18} 
                    className="text-gray-400 hover:text-blue-500 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                     
                    }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    };

    const handleCreateApplication = async () => {
        if (!selectedParentType || !selectedSubType) {
            toast.error("Vennligst velg en søknadstype");
            return;
        }
        
        setIsCreating(true);
        
        try {
            const appType = typeof selectedParentType === 'string' 
                ? selectedParentType 
                : selectedParentType.toString();
                
            console.log("Creating application with:", {
                applicationType: appType,
                subTypeId: selectedSubType,
            });
            
            // Create the application
            await createApplication.mutateAsync({
                applicationType: appType as ApplicationType,
                subTypeId: selectedSubType,
                submissionDate: new Date(),
                updatedDate: new Date(),
                status: "Pabegynt"
            });
            
            // No need to call onTypeSelect since we're redirecting directly
        } catch (error) {
            console.error("Error creating application:", error);
            setIsCreating(false);
        }
    };

    const handleNext = () => {
        // Create application directly
        handleCreateApplication();
    };

    const handlePrev = () => {
        // Confirm before exiting
        const confirmExit = window.confirm("Er du sikker på at du vil forlate siden?");
        if (confirmExit) {
            router.push("/atlas-app");
        }
    };
    
    // If we're in the process of creating an application, show a loading state
    if (isCreating) {
        return (
            <div className="container mx-auto py-6 px-4 flex flex-col items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-kartAI-blue mb-4"></div>
                    <p className="text-lg">Oppretter søknad...</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="container mx-auto py-6 px-4 flex flex-col">
            <div className="flex space-x-8 flex-1">
                <div className="w-full max-w-3xl mx-auto">
                    {isNewApplication && renderSubtypeSelection()}
                </div>
            </div>

            <div className="flex justify-between mt-8 gap-4 max-w-3xl mx-auto w-full">
                <Button 
                    onClick={handlePrev} 
                    className="border-2 bg-white text-gray-500 border-gray-500 hover:bg-gray-500 hover:text-white w-44"
                >
                    <ArrowLeft size={18} className="mr-2" />
                    Avbryt
                </Button>
                <Button 
                    onClick={handleNext}
                    disabled={!selectedParentType || !selectedSubType || createApplication.isLoading}
                    className="border-2 bg-white text-kartAI-blue border-kartAI-blue hover:text-white hover:bg-kartAI-blue w-44"
                >
                    {createApplication.isLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current mr-2"></div>
                    ) : null}
                    Start søknad
                    <ArrowRight size={18} className="ml-2" />
                </Button>
            </div>
        </div>
    );
}