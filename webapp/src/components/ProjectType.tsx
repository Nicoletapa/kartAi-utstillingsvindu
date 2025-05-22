/**
 * This file is used in Utstillingsvindu 2.0
 *
 * @description
 * This component is part of the pre-step process for sending an application.
 * It allows the user to select the type of project they are applying for (e.g., bygge, rive, bruksendring),
 * and provides a map interface (TiltaksAidMap.tsx). The intention for the map is to allow the user to get
 * required drawings for their application (situasjonskart).
 * Though, this is not yet implemented in the TiltaksAid project.
 * 
 * @features
 * - Radio buttons for selecting project type
 * - If choosing "Bygge" or "Rive", checkboxes for selecting the specific area will be provided.
 * - Map interface for effective getting "situasjonskart". (Not yet implemented)
 * 
 * @props
 * - `formData`: The form data containing the description of the project.
 * - `setFormData`: Function to update the form data.
 * - `onValidityChange`: Callback function to handle form validity changes.
 * 
 * @note
 * - This file uses TypeScript and React. It is designed to be used in a Next.js application.
 * - This file uses Tailwind CSS for styling and Lucide React icons.
 * 
 * @usage
 * <ProjectType 
 *   formData={formData}
 *   setFormData={setFormData}
 *   onValidityChange={handleValidityChange}
 *   onUpload={handleUpload}
 * />  
 */

"use client";

import * as L from "leaflet";
import type{ Map } from "leaflet";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, ArrowRight, Info, Loader2 } from "lucide-react";
import { useRouter, useParams } from "next/navigation"; 
import { Button } from "../components/ui/button";
import { api } from "~/trpc/react";
import type { ApplicationType } from "@prisma/client";
import { toast } from "react-hot-toast"; 
import TiltaksAidMap from "../components/TiltaksAidMap";
import { PropertySearchBar } from "../components/map/PropertySearchBar";
import { searchProperty as fetchProperty } from "../utils/propertyUtils";
import { usePropertySearch } from "../hooks/usePropertySearch";
import type { SpatialAnalysisResult } from "../utils/propertyUtils";

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

const MAX_ZOOM = 19;
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

const ProjectType: React.FC<PageProps> = ({
  formData: externalFormData,
  setFormData: externalSetFormData,
  onValidityChange = (isValid: boolean) => {
    console.log("Form validity changed:", isValid);},  
}) => {
    const router = useRouter();
    const params = useParams();
    const applicationID = parseInt(params.applicationID as string, 10);

    const [internalFormData, setInternalFormData] = useState({ description: "" });
    const [selectedOption, setSelectedOption] = useState("");
    const [selectedCheckboxes, setSelectedCheckboxes] = useState<string[]>([]);
    const [hoveredBox, setHoveredBox] = useState<string | null>(null);
    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
    const [isFormValid, setIsFormValid] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [propertyBoundary, setPropertyBoundary] = useState<L.Layer | null>(null);
    const [propertyBoundaries, setPropertyBoundaries] = useState<GeoJSON.Feature[]>([]);
    const [autoZoomSuccessful, setAutoZoomSuccessful] = useState(false);
    const [mapReady, setMapReady] = useState(false);
    const [lastDrawnShape, setLastDrawnShape] = useState<GeoJSON.Feature | null>(null);
    const [spatialAnalysis, setSpatialAnalysis] = useState<SpatialAnalysisResult | null>(null);

    const mapRef = useRef<Map | null>(null);
    const loggedPropertyData = useRef(false);
    
    const formData = externalFormData ?? internalFormData;
    
    const { data: applicationData } = api.application.getApplication.useQuery(
        { applicationID },
        { enabled: !isNaN(applicationID) }
    );

    const { userData, searchInput, setSearchInput, errorMessage, setErrorMessage } = usePropertySearch();
    
      const handleMapReady = useCallback((map: Map) => {
        if (!mapRef.current) {
          mapRef.current = map;
          setMapReady(true);
        }
      }, []);
    
      const handleShapeDrawn = useCallback((shape: GeoJSON.Feature, analysis?: SpatialAnalysisResult) => {
        setLastDrawnShape(shape);
        setSpatialAnalysis(analysis ?? null);
      }, []);

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

    const handlePropertySearch = async (propertyNumberToSearch: string = searchInput) => {
        const data = await fetchProperty(propertyNumberToSearch, process.env.NEXT_PUBLIC_SUPABASE_KEY);
    
        if (!data?.length) {
          setErrorMessage("No property found with this number or invalid property data");
          return;
        }
    
        const geometry = data[0]?.geom as GeoJSON.Geometry | undefined;
        if (!geometry) {
          setErrorMessage("Invalid geometry data for the property");
          return;
        }
        if (!geometry) return;
    
        if (propertyBoundary && mapRef.current) {
          mapRef.current.removeLayer(propertyBoundary);
        }
    
        const propertyFeature: GeoJSON.Feature = {
          type: "Feature",
          geometry: geometry,
          properties: {
            id: propertyNumberToSearch,
            matrikkelnummer: data[0]?.matrikkelnummer,
          },
        };
        
        setPropertyBoundaries([propertyFeature]);
    
        if (!loggedPropertyData.current) {
          loggedPropertyData.current = true;
        }
    
        const newBoundary = L.geoJSON(propertyFeature, {
          style: { color: "blue", weight: 2, fillOpacity: 0.1 },
        });
    
        if (mapRef.current) {
          newBoundary.addTo(mapRef.current);
          mapRef.current.fitBounds(newBoundary.getBounds(), { maxZoom: MAX_ZOOM, padding: [20, 20] });
          setAutoZoomSuccessful(true);
        }
    
        setPropertyBoundary(newBoundary);
        setErrorMessage(null);
      };

    const checkFormValidity = (
        data: typeof formData, 
        option: string, 
        checkboxes: string[] = selectedCheckboxes
    ) => {
        const isCheckboxValid = (option === "Bygge" || option === "Rive") ? checkboxes.length > 0 : true;
        const isValid = option !== '' && isCheckboxValid;
        
        setIsFormValid(isValid);
        
        if (typeof onValidityChange === 'function') {
            onValidityChange(isValid);
        }
    };

    const handleBack = () => {
        router.push(`/atlas-app/i-soknad/${applicationID}/applicant-details`);
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

        const appType = getApplicationTypeFromSelection(selectedOption);
        
        if (appType === "bruksendring") {
            router.push(`/atlas-app/i-soknad/${applicationID}/bruksendring`);
        } else  {
            router.push(`/atlas-app/i-soknad/${applicationID}/bygge-eller-rive`);
        } 
        
        setIsUpdating(false);
    } catch (error: unknown) {
        console.error("Error updating application type:", error);
        
        let errorMessage = 'Something went wrong';
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === 'object' && error !== null && 'message' in error) {
            errorMessage = String((error as { message: unknown }).message);
        }
        
        toast.error(`Error: ${errorMessage}`);
        setIsUpdating(false);
    }
    };

    useEffect(() => {
        checkFormValidity(formData, selectedOption);
    }, [formData, selectedOption, selectedCheckboxes]);

    useEffect(() => {
        if (!applicationData) return;
        
        if (applicationData?.subTypeId) {
            if (applicationData.subTypeId === "standard") {
                setSelectedOption("Bruksendring");
            } 
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
        
        const description = applicationData?.application_fields?.find(f => f.fieldName === 'description')?.fieldValue ?? '';
        updateFormData({ description });
    }, [applicationData]);

    return (
        <div className="flex flex-col items-center justify-center h-full mt-10 w-full max-w-[900px] mx-auto">
            <h1 className="text-3xl font-bold justify-center flex">
                Hva vil du gjøre på eiendommen din?
            </h1>
            <div className="border-2 border-gray-400 rounded-lg mt-4 p-4 w-full">
                <div className="flex flex-col md:flex-row gap-8">
                    <div className="w-full">
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
                </div>
            </div>
            <div className="border-2 border-gray-400 rounded-lg mt-4 p-4 w-full">
                <h1 className="font-medium inline-flex mb-2">
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
                            {checkboxOptions[selectedOption ].map((option) => (
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
                
                <PropertySearchBar
                    searchInput={searchInput}
                    onSearchInputChange={setSearchInput}
                    onSearch={() => handlePropertySearch()}
                    errorMessage={errorMessage}
                />
                <div className="no-rounded-map relative z-0">
                    <TiltaksAidMap
                        onMapReady={handleMapReady}
                        onShapeDrawn={handleShapeDrawn}
                        userGnr={userData?.gnr}
                        userBnr={userData?.bnr}
                        userFnr={userData?.fnr}
                        userSnr={userData?.snr}
                        autoZoom={true}
                    />
                </div>
            </div>

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
                        <Loader2 className="animate-spin text-gray-500" size={24} />
                    )}
                    <span className="relative inline-block">Neste</span>
                    <ArrowRight className="w-5 h-5 transition-transform duration-300" />
                </Button>
            </div>
        </div>
    );
};

export default ProjectType;