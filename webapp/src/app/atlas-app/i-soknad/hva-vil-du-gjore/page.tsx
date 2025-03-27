"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Info, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { Button } from "../../../../components/ui/button";

interface PageProps {
    onUpload: (files: File[]) => void;
  formData?: {
    description: string;
    areaPurpose: string;
  };
  setFormData?: React.Dispatch<React.SetStateAction<{
    description: string;
    areaPurpose: string;
  }>>;
  onValidityChange?: (isValid: boolean) => void;
}

const Page: React.FC<PageProps> = ({ 
  formData: externalFormData, 
  setFormData: externalSetFormData, 
  onValidityChange = () => {}, onUpload = () => {}, 
    }) => {

    const router = useRouter();
    const [internalFormData, setInternalFormData] = useState({ description: "", areaPurpose: "" });
    const [selectedOption, setSelectedOption] = useState("");
    const [selectedCheckboxes, setSelectedCheckboxes] = useState<string[]>([]);
    const [hoveredBox, setHoveredBox] = useState<string | null>(null);
    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
    const [isFormValid, setIsFormValid] = useState(false);

    const formData = externalFormData || internalFormData;

    const [uploadedFiles, setUploadedFiles] = useState<{ file: File; name: string | null }[]>([]);
    const onDrop = useCallback(
        async (acceptedFiles: File[]) => {
            if (acceptedFiles.length > 0) {
                const newFiles = acceptedFiles.map((file) => ({
                    file,
                    name: file.name,
                }));
    
                setUploadedFiles((prev) => [...prev, ...newFiles]);
    
                setTimeout(() => {
                    onUpload(acceptedFiles);
                    checkFormValidity(formData, selectedOption, [...uploadedFiles, ...newFiles].map(f => f.file)); 
                }, 2000);
            }
        },
        [onUpload, formData, selectedOption, uploadedFiles]
    );
    
    const handleDelete = (index: number) => {
        setUploadedFiles((prev) => {
            const newFiles = prev.filter((_, i) => i !== index);
            checkFormValidity(formData, selectedOption, newFiles.map(f => f.file));
            return newFiles;
        });
    };
    
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.tiff', '.bmp'],
            'application/pdf': ['.pdf'],
            'application/dwg': ['.dwg'],
            'application/dxf': ['.dxf'],
        },
        multiple: true,
    });

    const updateFormData = (newData: typeof formData) => {
        if (typeof externalSetFormData === 'function') {
            externalSetFormData(newData);
        } else {
            setInternalFormData(newData);
        }
    };

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

    const handleMouseEnter = (box: string) => {
        if (timeoutId) clearTimeout(timeoutId);
        setHoveredBox(box);
    };

    const handleMouseLeave = () => {
        const id = setTimeout(() => setHoveredBox(null), 300);
        setTimeoutId(id);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const updatedFormData = { ...formData, [name]: value };
        updateFormData(updatedFormData);
        checkFormValidity(updatedFormData, selectedOption, uploadedFiles.map(f => f.file));
    };

    const handleCheckboxChange = (checkboxValue: string) => {
        setSelectedCheckboxes((prev) => {
            if (prev.includes(checkboxValue)) {
                return prev.filter((value) => value !== checkboxValue);
            } else {
                return [...prev, checkboxValue];
            }
        });
    };

    const handleOptionChange = (value: string) => {
        setSelectedOption(value);
        setSelectedCheckboxes([]);
        checkFormValidity(formData, value, uploadedFiles.map(f => f.file));
    };

    const checkFormValidity = (data: typeof formData, option: string, files: File[]) => {
        const descriptionText = data?.description || '';
        const isFileUploaded = files.length > 0;
        const isCheckboxValid = (option === "Bygge" || option === "Rive") ? selectedCheckboxes.length > 0 : true;
        const isValid = descriptionText.trim() !== '' && option !== '' && isFileUploaded && isCheckboxValid;
        
        setIsFormValid(isValid);
        
        if (typeof onValidityChange === 'function') {
            onValidityChange(isValid);
        }
    };
    
    useEffect(() => {
        checkFormValidity(formData, selectedOption, uploadedFiles.map(f => f.file));
    }, [formData, selectedOption, uploadedFiles, selectedCheckboxes]);

    const getNextPageUrl = () => {
        if (selectedOption === "Bruksendring") {
            return "/atlas-app/i-soknad/bruksendring";
        } else if (selectedOption === "Bygge" || selectedOption === "Rive") {
            return "/atlas-app/i-soknad/bygge-eller-rive";
        }
        return "#";
    };

    const handleBack = () => {
        router.push("/atlas-app/i-soknad/");
    };
    
    return (
        <div className="flex flex-col items-center justify-center h-full mt-10 w-full max-w-[900px] mx-auto">
            <h1 className="text-3xl font-bold justify-center flex">
                Hva vil du gjøre på eiendommen din?
            </h1>

            <div
                className="border-2 border-gray-400 rounded-lg mt-4 p-4 w-full"
                data-cy="main-container"
            >
                <div className="flex flex-col md:flex-row gap-8">
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

                    <div
                        className="w-full md:w-3/6 md:border-l-2 md:border-gray-400 md:pl-8"
                        data-cy="right-column"
                    >
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
                                        className="absolute top-0 left-6 bg-white shadow-lg border rounded-lg p-3 w-64 text-sm"
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

            <div className="border-2 border-gray-400 rounded-lg mt-4 p-4 w-full">
                <h1 className="font-medium inline-flex">Arealformål
                    <div className="relative flex">
                        <Info
                            size={14}
                            className="ml-1 hover:cursor-pointer"
                            onMouseEnter={() => handleMouseEnter('arealformål')}
                            onMouseLeave={handleMouseLeave}
                        />
                        {hoveredBox === 'arealformål' && (
                            <div
                                className="absolute top-0 left-6 bg-white shadow-lg border rounded-lg p-3 w-64 text-sm"
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
                                        className=" mt-1 rounded border-gray-300 text-kartAI-blue focus:ring-kartAI-blue"
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

                <div
                    {...getRootProps()}
                    className={`h-12 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed mb-4 transition-colors ${
                        isDragActive ? "bg-gray-300 border-gray-400" : "bg-gray-100 hover:bg-gray-200"
                    }`}
                >
                    <input {...getInputProps()} className="hidden" multiple />
                    <span className="text-sm text-gray-500 flex items-center">
                        {isDragActive ? "Slipp filene her" : "Dra og slipp filer eller klikk for å laste opp"}
                        <Upload size={18} className="text-gray-500 ml-2" />
                    </span>
                </div>

                <div className="mt-2">
                    {uploadedFiles.length > 0 && (
                        <ul className="list-disc pl-5 text-sm text-gray-600">
                            {uploadedFiles.map((fileObj, index) => (
                                <li key={index} className="flex justify-between items-center">
                                    {fileObj.name}
                                    <button
                                        className="text-red-500 text-xs ml-2"
                                        onClick={() => handleDelete(index)}
                                    >
                                        Slett
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                {uploadedFiles.length === 0 && (
                    <p className="text-red-500 text-sm mt-1">Vennligst last opp en fil</p>
                )}
            </div>

            <div className="mt-5 w-full flex justify-center mb-4 gap-4">
                <Button onClick={handleBack} className="border-2 bg-white text-gray-500 border-gray-500 hover:bg-gray-500 hover:text-white w-44">
                    <ArrowLeft className="w-5 h-5 transition-transform duration-300 group-hover: -translate-x-1" />
                    <span className="relative inline-block">Tilbake</span>
                </Button>
                <Button
                    onClick={(e) => {
                        if (isFormValid) {
                            router.push(getNextPageUrl());
                        } else {
                            e.preventDefault();
                        }
                    }}
                    className={`px-4 py-3 group flex items-center gap-2 border-2 rounded-lg transition-all bg-white hover:bg-white w-44 ${
                        isFormValid
                            ? "text-kartAI-blue border-kartAI-blue bg-white hover:bg-kartAI-blue hover:text-white"
                            : "text-gray-400 border-gray-300 cursor-not-allowed"
                    }`}
                    aria-disabled={!isFormValid}
                >
                    <ArrowRight className="w-5 h-5 transition-transform duration-300" />
                    <span className="relative inline-block">Neste</span>
                </Button>
            </div>
        </div>
    );
};

export default Page;