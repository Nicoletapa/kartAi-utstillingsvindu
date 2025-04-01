"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, Info } from "lucide-react";
import { useRouter, useParams } from "next/navigation"; 
import { Button } from "../../../../../components/ui/button";
import { api } from "~/trpc/react"; 
import { ApplicationType } from "@prisma/client";
import { toast } from "react-hot-toast"; 

// Types
interface PageProps {
  onUpload: (files: File[]) => void;
  formData?: {
    description: string;
  };
  setFormData?: React.Dispatch<React.SetStateAction<{
    description: string;
  }>>;
  onValidityChange?: (isValid: boolean) => void;
}

// Options data
const options = [
    {
        value: "Bruksendring",
        label: "Bruksendring",
        description: "F.eks. gjøre om en bod til soverom, garasje til hybel eller kjeller til boenhet.",
    },
    {
        value: "Bygge",
        label: "Bygge",
        description: "F.eks. garasje, terrasse, gjerde, tilbygg, drivhus eller hagestue.",
    },
    {
        value: "Rive",
        label: "Rive",
        description: "F.eks. gammel garasje, uthus, lekesture eller et tilbygg.",
    },
];

const checkboxOptions = {
    Bygge: [
        { value: "byggeTilbygg", label: "Bygge tilbygg - mindre enn 50m²" },
        { value: "byggeFrittliggende", label: "Bygge frittliggende bygning - mindre enn 70m² og hvor ingen skal bo eller overnatte." },
        { value: "byggeAnnet", label: "Annet (kun etter avtale med kommunen)" }
    ],
    Rive: [
        { value: "riveTilbygg", label: "Rive et tilbygg - mindre enn 50m²" },
        { value: "riveFrittliggende", label: "Rive frittliggende bygning - mindre enn 70m² som ikke er godkjent som bolig eller til overnatting." },
        { value: "riveAnnet", label: "Annet (kun etter avtale med kommunen)" }
    ]
};

const Page: React.FC<PageProps> = ({ 
  formData: externalFormData, 
  setFormData: externalSetFormData, 
  onValidityChange = () => {}, 
  onUpload = () => {}, 
}) => {
    // Hooks
    const router = useRouter();
    const params = useParams();
    const applicationID = parseInt(params.applicationID as string, 10);

    // State
    const [internalFormData, setInternalFormData] = useState({ description: "" });
    const [selectedOption, setSelectedOption] = useState("");
    const [selectedCheckboxes, setSelectedCheckboxes] = useState<string[]>([]);
    const [hoveredBox, setHoveredBox] = useState<string | null>(null);
    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
    const [isFormValid, setIsFormValid] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<{ file: File; name: string | null }[]>([]);
    
    // Form data handling
    const formData = externalFormData || internalFormData;
    
    // API queries and mutations
    const { data: applicationData } = api.application.getApplication.useQuery(
        { applicationID },
        { enabled: !isNaN(applicationID) }
    );

    const updateApplication = api.application.updateApplication.useMutation({
        onSuccess: () => {
            setIsUpdating(false);
            toast.success("Søknadstype oppdatert");
        },
        onError: (error) => {
            setIsUpdating(false);
            toast.error(`Feil: ${error.message}`);
        }
    });

    const addApplicationField = api.application.addApplicationField.useMutation({
        onError: (error) => {
            toast.error(`Feil ved lagring av felt: ${error.message}`);
        }
    });

    const updateApplicationSubtype = api.application.updateApplicationSubtype.useMutation({
        onSuccess: () => {
            toast.success("Søknadstype oppdatert");
        },
        onError: (error) => {
            toast.error(`Feil ved oppdatering av søknadstype: ${error.message}`);
        }
    });

    // Utility functions
    const updateFormData = (newData: typeof formData) => {
        if (typeof externalSetFormData === 'function') {
            externalSetFormData(newData);
        } else {
            setInternalFormData(newData);
        }
    };
    
    const handleMouseEnter = (box: string) => {
        if (timeoutId) clearTimeout(timeoutId);
        setHoveredBox(box);
    };

    const handleMouseLeave = () => {
        const id = setTimeout(() => setHoveredBox(null), 300);
        setTimeoutId(id);
    };

    // Type selection helpers
    const getApplicationTypeFromSelection = (option: string): ApplicationType | null => {
        if (option === "Bygge" || option === "Rive") {
            return "sma_byggeprosjekter";
        } else if (option === "Bruksendring") {
            return "bruksendring";
        }
        return null;
    };

    const getDefaultSubType = (option: string): string | null => {
        if (option === "Bruksendring") {
            return "standard";
        }
        return null;
    };

    const getSubTypeFromSelection = (option: string, checkboxes: string[]): string | null => {
        if (option === "Bygge") {
            if (checkboxes.includes("byggeTilbygg")) return "bygge_tilbygg";
            if (checkboxes.includes("byggeFrittliggende")) return "bygge_frittliggende";
            if (checkboxes.includes("byggeAnnet")) return "bygge_annet";
        } 
        else if (option === "Rive") {
            if (checkboxes.includes("riveTilbygg")) return "rive_tilbygg";
            if (checkboxes.includes("riveFrittliggende")) return "rive_frittliggende";
            if (checkboxes.includes("riveAnnet")) return "rive_annet";
        }
        return null;
    };

    // Event handlers
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const updatedFormData = { ...formData, [name]: value };
        updateFormData(updatedFormData);
        checkFormValidity(updatedFormData, selectedOption);
    };

    const handleCheckboxChange = (checkboxValue: string) => {
        const newCheckboxes = selectedCheckboxes.includes(checkboxValue)
            ? selectedCheckboxes.filter((value) => value !== checkboxValue)
            : [...selectedCheckboxes, checkboxValue];
        
        setSelectedCheckboxes(newCheckboxes);
        checkFormValidity(formData, selectedOption, newCheckboxes);
        
        const updatedSubType = getSubTypeFromSelection(selectedOption, newCheckboxes);
        if (updatedSubType) {
            saveSubType(updatedSubType);
        }
    };

    const handleOptionChange = (value: string) => {
        setSelectedOption(value);
        setSelectedCheckboxes([]);
        checkFormValidity(formData, value, []);
        
        const appType = getApplicationTypeFromSelection(value);
        if (appType) {
            updateApplication.mutate({
                applicationID,
                applicationType: appType,
                updatedDate: new Date()
            });
            
            const defaultSubType = getDefaultSubType(value);
            if (defaultSubType) {
                saveSubType(defaultSubType);
            }
        }
    };

    const saveSubType = (subType: string) => {
        updateApplicationSubtype.mutate({
            applicationID,
            subTypeId: subType,
        });
    };

    // Form validation
    const checkFormValidity = (
        data: typeof formData, 
        option: string, 
        checkboxes: string[] = selectedCheckboxes
    ) => {
        const descriptionText = data?.description || '';
        const isCheckboxValid = (option === "Bygge" || option === "Rive") ? checkboxes.length > 0 : true;
        const isValid = descriptionText.trim() !== '' && option !== '' && isCheckboxValid;
        
        setIsFormValid(isValid);
        
        if (typeof onValidityChange === 'function') {
            onValidityChange(isValid);
        }
    };

    // Navigation handlers
    const handleBack = () => {
        router.push(`/atlas-app/i-soknad/${applicationID}/applicant-details`);
    };

    const determineApplicationType = (): ApplicationType | null => {
        return getApplicationTypeFromSelection(selectedOption);
    };

    const handleNext = async () => {
        if (!isFormValid) return;
        
        setIsUpdating(true);
        
        try {
            await addApplicationField.mutateAsync({
                applicationID,
                fieldName: 'description',
                fieldValue: formData.description || '',
            });

             // Get the application type based on user selection
        const appType = getApplicationTypeFromSelection(selectedOption);
        
        // Navigate to different routes based on application type
        if (appType === "bruksendring") {
            // For bruksendring applications
            router.push(`/atlas-app/i-soknad/${applicationID}/bruksendring`);
        } else  {
            // For bygge/rive applications
            router.push(`/atlas-app/i-soknad/${applicationID}/bygge-eller-rive`);
        } 
        
        // Reset updating state in case navigation takes time
        setIsUpdating(false);
    } catch (error: any) {
        console.error("Error updating application type:", error);
        toast.error(`Error: ${error.message || 'Something went wrong'}`);
        setIsUpdating(false);
    }
    };

    // Side effects
    useEffect(() => {
        checkFormValidity(formData, selectedOption);
    }, [formData, selectedOption, selectedCheckboxes]);

    useEffect(() => {
        if (!applicationData) return;
        
        if (applicationData?.subTypeId) {
            // For standard bruksendring
            if (applicationData.subTypeId === "standard") {
                setSelectedOption("Bruksendring");
            } 
            // For bygge subtypes
            else if (applicationData.subTypeId.startsWith("bygge_")) {
                setSelectedOption("Bygge");
                const subType = applicationData.subTypeId.replace("bygge_", "");
                if (subType === "tilbygg") {
                    setSelectedCheckboxes(["byggeTilbygg"]);
                } else if (subType === "frittliggende") {
                    setSelectedCheckboxes(["byggeFrittliggende"]);
                } else if (subType === "annet") {
                    setSelectedCheckboxes(["byggeAnnet"]);
                }
            } 
            // For rive subtypes
            else if (applicationData.subTypeId.startsWith("rive_")) {
                setSelectedOption("Rive");
                const subType = applicationData.subTypeId.replace("rive_", "");
                if (subType === "tilbygg") {
                    setSelectedCheckboxes(["riveTilbygg"]);
                } else if (subType === "frittliggende") {
                    setSelectedCheckboxes(["riveFrittliggende"]);
                } else if (subType === "annet") {
                    setSelectedCheckboxes(["riveAnnet"]);
                }
            }
        }
        
        const description = applicationData?.application_fields?.find(f => f.fieldName === 'description')?.fieldValue || '';
        updateFormData({ description });
    }, [applicationData]);

    // Render
    return (
        <div className="flex flex-col items-center justify-center h-full mt-10 w-full max-w-[900px] mx-auto">
            <h1 className="text-3xl font-bold justify-center flex">
                Hva vil du gjøre på eiendommen din?
            </h1>

            <div className="border-2 border-gray-400 rounded-lg mt-4 p-4 w-full" data-cy="main-container">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Project Type Selection */}
                    <div className="w-full md:w-3/6" data-cy="left-column">
                        <h1 className="font-medium">Hva gjelder tiltaket?</h1>
                        <div className="flex flex-col space-y-4 mt-2">
                            {options.map((option) => (
                                <label
                                    key={option.value}
                                    className="flex flex-col border rounded-md p-3 cursor-pointer transition-all hover:bg-gray-100"
                                >
                                    <div className="flex items-center">
                                        <input
                                            type="radio"
                                            name="tiltak"
                                            value={option.value}
                                            checked={selectedOption === option.value}
                                            onChange={() => handleOptionChange(option.value)}
                                            className="mr-2"
                                        />
                                        <span className="font-medium">{option.label}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Project Description */}
                    <div className="w-full md:w-3/6 md:border-l-2 md:border-gray-400 md:pl-8" data-cy="right-column">
                        <h2 className="font-medium inline-flex">
                            Beskrivelse av tiltaket
                            <div className="relative flex">
                                <Info
                                    size={14}
                                    className="ml-1 hover:cursor-pointer"
                                    onMouseEnter={() => handleMouseEnter('beskrivelse')}
                                    onMouseLeave={handleMouseLeave}
                                />
                                {hoveredBox === 'beskrivelse' && (
                                    <div
                                        className="absolute top-0 left-6 bg-white shadow-lg border rounded-lg p-3 w-64 text-sm z-10"
                                        onMouseEnter={() => handleMouseEnter('beskrivelse')}
                                        onMouseLeave={handleMouseLeave}
                                    >
                                        Her kan du gi en detaljert beskrivelse av tiltaket du planlegger å gjennomføre.
                                    </div>
                                )}
                            </div>
                        </h2>            
                        <textarea
                            name="description"
                            className="w-full min-h-60 mt-2 p-4 text-md border-2 border-gray-300 rounded-lg"
                            placeholder="Skriv her ..."
                            value={formData?.description || ""}
                            onChange={handleInputChange}
                            required
                        />
                        {!formData?.description?.trim() && (
                            <p className="text-red-500 text-sm mt-1">Dette feltet er påkrevd</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Project Details and Drawings */}
            <div className="border-2 border-gray-400 rounded-lg mt-4 p-4 w-full">
                <h1 className="font-medium inline-flex">
                    Tegninger
                    <div className="relative flex">
                        <Info
                            size={14}
                            className="ml-1 hover:cursor-pointer"
                            onMouseEnter={() => handleMouseEnter('arealformål')}
                            onMouseLeave={handleMouseLeave}
                        />
                        {hoveredBox === 'arealformål' && (
                            <div
                                className="absolute top-0 left-6 bg-white shadow-lg border rounded-lg p-3 w-64 text-sm z-10"
                                onMouseEnter={() => handleMouseEnter('arealformål')}
                                onMouseLeave={handleMouseLeave}
                            >
                                Vennligst last opp vedlegg som viser hva arealet skal brukes til.
                            </div>
                        )}
                    </div>
                </h1>

                {(selectedOption === "Bygge" || selectedOption === "Rive") && (
                    <div className="mb-4">
                        <p className="text-sm mb-2">Hva vil du {selectedOption === "Bygge" ? "bygge" : "rive"}?</p>
                        <div className="flex gap-4">
                            {checkboxOptions[selectedOption as keyof typeof checkboxOptions].map((option) => (
                                <label key={option.value} className="flex items-start space-x-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={selectedCheckboxes.includes(option.value)}
                                        onChange={() => handleCheckboxChange(option.value)}
                                        className="mt-1 rounded border-gray-300 text-kartAI-blue focus:ring-kartAI-blue"
                                    />
                                    <span>{option.label}</span>
                                </label>
                            ))}
                        </div>
                        {selectedCheckboxes.length === 0 && (
                            <p className="text-red-500 text-sm mt-1">Velg minst ett alternativ</p>
                        )}
                    </div>
                )}

                <p>[SITUASJONSKART]</p>
            </div>

            {/* Navigation Buttons */}
            <div className="mt-5 w-full flex justify-center mb-4 gap-4">
                <Button 
                    onClick={handleBack} 
                    className="border-2 bg-white text-gray-500 border-gray-500 hover:bg-gray-500 hover:text-white w-44"
                >
                    <ArrowLeft className="w-5 h-5 transition-transform duration-300 group-hover: -translate-x-1" />
                    <span className="relative inline-block">Tilbake</span>
                </Button>
                <Button
                    onClick={handleNext}
                    disabled={!isFormValid || isUpdating}
                    className={`px-4 py-3 group flex items-center gap-2 border-2 rounded-lg transition-all bg-white hover:bg-white w-44 ${
                        isFormValid && !isUpdating
                            ? "text-kartAI-blue border-kartAI-blue bg-white hover:bg-kartAI-blue hover:text-white"
                            : "text-gray-400 border-gray-300 cursor-not-allowed"
                    }`}
                    aria-disabled={!isFormValid || isUpdating}
                >
                    {isUpdating && (
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current mr-2"></div>
                    )}
                    <span className="relative inline-block">Neste</span>
                    <ArrowRight className="w-5 h-5 transition-transform duration-300" />
                </Button>
            </div>
        </div>
    );
};

export default Page;