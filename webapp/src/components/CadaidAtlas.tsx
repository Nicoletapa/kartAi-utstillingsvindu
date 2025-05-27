/**
 * This file is used in Utstillingsvindu 2.0
 * 
 * @description
 * Provides an interface for uploading and validating architectural document files
 * using AI-based detection API. It supports multiple file formats (PDF, PNG, JPG, DWG, etc.) and
 * categorizes documents based on drawing types detected (e.g., plans, sections, elevations).
 * 
 * @features
 * - File upload with AI detection of drawing types
 * - Save detection results to user profile/application
 * - View full-size preview of images
 * - Replace or delete existing documents
 * - Handles invalid or duplicate files
 * 
 * @props
 * - applicationID (number, optional): Used to associate uploaded documents with a specific application
 * 
 * @note
 * - Internal Interfaces:
 *   - FileDetection: Links filenames to detected drawing types
 *   - InvalidFile: Holds unprocessable file and its base64 representation

*/

"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import Results from "./Results";
import type { Detection } from "~/types/detection";
import { api } from "~/trpc/react";
import { useSession } from "next-auth/react";
import ExistingDocumentsList from './ExistingDocumentsList';
import InvalidFilesList from './InvalidFilesList';
import { X, Info, Loader2 } from 'lucide-react';
import Image from "next/image";
import { skipToken } from "@tanstack/react-query";
import { appendErrorMessage } from "~/utils/errorMessage";


interface CadaidAtlasProps {
  applicationID?: number;
}

interface FileDetection {
  drawing_type: string[];
  file_name: string;
}

interface InvalidFile {
  file: File;
  base64: string;
}

const DOCUMENT_REQUIREMENTS = [
  "Alle tegninger er i målestokk og målsatte",
  "Plantegningene må oppgi hvor store rommene er og hva de brukes til",
  "Fasadetegninger må vise alle sider av bygningen, og terrenget rundt bygningen både før og etter endringen",
  {
    text: "Situasjonskartet skal inneholde det du skal bygge eller endre, med mål på korteste avstand og fram til:",
    subItems: [
      "Nærmeste bygg på egen eiendom",
      "Nærmeste nabobygning",
      "Nabogrense",
      "Midten av gang-, sykkel- eller bilvei"
    ]
  },
  {
    text: "Snittegninger må vise snittet på bygningen både på langs og på tvers. Dersom boligen har flere etasjer, må høyden på disse oppgis"
  }
];

const MODAL_CONTENT = {
  title: "Hva er Dokumentsjekk?",
  description: [
    "Dokumentsjekk er et verktøy som lar deg laste opp dokumenter for å sjekke om de inneholder nødvendige tegninger for byggesøknad ved hjelp av kunstig intelligens.",
    "Du kan laste opp dokumenter i formatene PDF, DWG, DXF, PNG, JPG, JPEG, TIFF og BMP.",
    "Validerte dokumenter vil bli lagret i din bruker for fremtidig bruk. Ugyldige opplastede dokumenter vil bli slettet."
  ]
};

const processFile = async (file: File, detections: Detection[]): Promise<{ base64: string; fileDetections: FileDetection[] }> => {
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const fileDetections = detections
    .filter(d => d.file_name === file.name)
    .map(d => ({
      drawing_type: Array.isArray(d.drawing_type) ? d.drawing_type : [],
      file_name: d.file_name
    }));
  
  return { base64, fileDetections };
};

const fetchDetection = async (formData: FormData): Promise<Detection[]> => {
  try {
    const response = await fetch("http://127.0.0.1:5001/detect", {
      method: "POST",
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("ML API Error:", errorText);
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json() as Detection[];
  } catch (error) {
    console.error("Fetch detection error:", error);
    throw error;
  }
};

const CadaidAtlas: React.FC<CadaidAtlasProps> = ({ applicationID }) => {
  const [state, setState] = useState({
    isLoading: false,
    isProcessing: false,
    results: [] as Detection[],
    errorMessage: null as string | null,
    successMessage: null as string | null,
    invalidFiles: [] as InvalidFile[],
    fullSizeImage: null as string | null,
    openModal: false,
    imageSrc: null as string | null
  });

  const { data: session } = useSession();
  const utils = api.useUtils();

  const documentsQuery = api.userDocuments.getUserDocuments.useQuery(
    applicationID !== undefined ? { applicationID } : skipToken, 
    { staleTime: 1000 * 60 }
  );

  const mutations = ({
    saveResults: api.userDocuments.saveDetectionResults.useMutation({
      onSuccess: () => {
        void utils.userDocuments.getUserDocuments.invalidate({ applicationID });
        setState(prev => ({
          ...prev,
          results: [],
          successMessage: "Dokumenter ble lastet opp",
          errorMessage: null
        }));
        setTimeout(() => setState(prev => ({ ...prev, successMessage: null })), 3000);
      },
      onError: (error) => {
        console.error("Error saving detection results:", error);
        setState(prev => ({
          ...prev,
          errorMessage: `Failed to save document: ${error.message}`
        }));
      }
    }),
    checkExistingFile: api.userDocuments.checkFileExists.useMutation(),
    deleteDocument: api.userDocuments.deleteDocument.useMutation({
      onSuccess: () => void utils.userDocuments.getUserDocuments.invalidate()
    })
  });

  const handleModal = useCallback((open: boolean) => {
    setState(prev => ({ ...prev, openModal: open }));
  }, []);

  const handleImageClick = useCallback((imageSrc: string) => {
    setState(prev => ({ ...prev, fullSizeImage: imageSrc }));
  }, []);

  const closeFullSizeImage = useCallback(() => {
    setState(prev => ({ ...prev, fullSizeImage: null, imageSrc: null }));
  }, []);

  const handleFileRemove = useCallback((index: number) => {
    setState(prev => {
      const fileToRemove = prev.invalidFiles[index]?.file.name;
      if (!fileToRemove) return prev;

      return {
        ...prev,
        invalidFiles: prev.invalidFiles.filter((_, i) => i !== index),
        results: prev.results.filter(result => result.file_name !== fileToRemove),
        errorMessage: prev.errorMessage 
          ? prev.errorMessage.split('\n')
              .filter(error => !error.includes(fileToRemove))
              .join('\n') || null
          : null
      };
    });
  }, []);

  const handleValidFile = useCallback(async (file: File, fileDetections: FileDetection[], base64: string) => {
    if (!applicationID) return;

    try {
      const result = await mutations.saveResults.mutateAsync({
        fileName: file.name,
        fileType: file.type,
        detectionResults: fileDetections,
        document: base64,
        applicationID
      });

      if (!result.success) {
        setState(prev => ({
          ...prev,
          invalidFiles: [...prev.invalidFiles, { file, base64 }],
          errorMessage: appendErrorMessage(
          prev.errorMessage, `${'message' in result ? result.message : 'Kunne ikke lagre dokumentet'}: ${file.name}`
        )
        }));
           
      }
    } catch (error) {
      console.error(`Error handling valid file ${file.name}:`, error);
    }
  }, [applicationID, mutations.saveResults]);

  const handleInvalidFile = useCallback((file: File, base64: string) => {
    setState(prev => ({
      ...prev,
      invalidFiles: [...prev.invalidFiles, { file, base64 }],
      errorMessage: appendErrorMessage(
        prev.errorMessage, 
        `${file.name} har ingen gyldige tegningstyper`)
    }));
  }, []);

  const handleDocumentDelete = useCallback(async (documentId: number) => {
    if (!applicationID) return;

    try {
      await mutations.deleteDocument.mutateAsync({ 
        documentId,
        applicationID
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      setState(prev => ({
        ...prev,
        errorMessage: 'Kunne ikke slette dokumentet'
      }));
    }
  }, [applicationID, mutations.deleteDocument]);

  const handleFileUpload = useCallback(async (uploadedFiles: File[]) => {
    if (state.isProcessing || state.isLoading || !session?.user?.id || !applicationID) {
      return;
    }

    if (uploadedFiles.length === 0) return;

    setState(prev => ({
      ...prev,
      isLoading: true,
      isProcessing: true,
      errorMessage: null
    }));

    try {
      const filesToProcess = await Promise.all(
        uploadedFiles.map(async (file) => {
          const existingFile = await mutations.checkExistingFile.mutateAsync({
            fileName: file.name,
            applicationID
          });

          if (existingFile.exists) {
            const confirmReplace = window.confirm(
              `Filen ${file.name} eksisterer allerede. Vil du erstatte denne filen?`
            );
            return confirmReplace ? file : null;
          }
          return file;
        })
      );

      const validFiles = filesToProcess.filter(Boolean) as File[];
      if (validFiles.length === 0) {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      const formData = new FormData();
      validFiles.forEach(file => formData.append("uploaded_files", file));

      const detections = await fetchDetection(formData);
      setState(prev => ({ ...prev, results: detections }));

      await Promise.all(
        validFiles.map(async (file) => {
          try {
            const { base64, fileDetections } = await processFile(file, detections);
            
            if (fileDetections.some(d => d.drawing_type.length > 0)) {
              await handleValidFile(file, fileDetections, base64);
            } else {
              handleInvalidFile(file, base64);
            }
          } catch (error) {
            console.error(`Error processing file ${file.name}:`, error);
            setState(prev => ({
              ...prev,
              errorMessage: appendErrorMessage(
                prev.errorMessage,
                `Kunne ikke prosessere filen ${file.name}`
              ) 
            }));
          }
        })
      );
    } catch (error) {
      console.error('Upload error:', error);
      setState(prev => ({
        ...prev,
        errorMessage: "Kunne ikke laste opp dokumenter"
      }));
    } finally {
      setState(prev => ({
        ...prev,
        isLoading: false,
        isProcessing: false
      }));
    }
  }, [state.isProcessing, state.isLoading, session?.user?.id, applicationID, mutations.checkExistingFile, handleValidFile, handleInvalidFile]);

  useEffect(() => {
    let objectUrl: string | null = null;

    if (state.fullSizeImage) {
      if (state.fullSizeImage.startsWith('data:image/')) {
        fetch(state.fullSizeImage)
          .then(res => {
            if (!res.ok) throw new Error(`Failed to fetch image: ${res.statusText}`);
            return res.blob();
          })
          .then(blob => {
            objectUrl = URL.createObjectURL(blob);
            setState(prev => ({ ...prev, imageSrc: objectUrl }));
          })
          .catch(error => {
            console.error("Error creating object URL from data URI:", error);
            setState(prev => ({ ...prev, imageSrc: null })); 
          });
      } else {
        if (state.imageSrc !== state.fullSizeImage) {
          setState(prev => ({ ...prev, imageSrc: state.fullSizeImage }));
        }
      }
    } else {
      if (state.imageSrc !== null) {
        setState(prev => ({ ...prev, imageSrc: null }));
      }
    }

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [state.fullSizeImage, state.imageSrc]); 

  const renderDocumentRequirements = useMemo(() => (
    <ul className="text-sm list-disc ml-6 mt-2 space-y-1 text-gray-700">
      {DOCUMENT_REQUIREMENTS.map((item, index) => {
        if (typeof item === 'string') {
          return <li key={index}>{item}</li>;
        }
        return (
          <li key={index}>
            {item.text}
            {item.subItems && (
              <ul className="list-disc ml-6 space-y-1">
                {item.subItems.map((subItem, subIndex) => (
                  <li key={subIndex}>{subItem}</li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  ), []);

  return (
    <div className="flex min-h-screen p-6 flex-col md:flex-row" data-cy="main-container">
      <div className="w-full md:w-2/3" data-cy="left-column">
        <h1 className="mb-5 text-left text-3xl font-bold">
          Dokumentsjekk
          <Info 
            size={18} 
            className="cursor-pointer inline-block ml-2 mb-8 text-black" 
            onClick={() => handleModal(true)}
          />
        </h1>

        {state.openModal && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" 
            onClick={() => handleModal(false)}
          >
            <div 
              className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full transform transition-all scale-95 opacity-0 animate-fadeIn"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-8">
                <h1 className="text-xl font-medium">{MODAL_CONTENT.title}</h1>
                {MODAL_CONTENT.description.map((paragraph, index) => (
                  <p key={index} className="text-sm mt-2">
                    {paragraph}
                  </p>
                ))}
              </div>
              <button 
                className="absolute mt-4 px-4 py-2 right-3 bottom-3 bg-gray-400 text-white rounded hover:bg-gray-500 transition"
                onClick={() => handleModal(false)}
              >
                Lukk
              </button>
            </div>
          </div>
        )}
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Mine Dokumenter</h2>
          {documentsQuery.isLoading ? (
            <div>Laster opp dokumenter...</div>
          ) : documentsQuery.error ? (
            <div className="text-red-500">Feil ved lasting av dokumenter</div>
          ) : (
            <ExistingDocumentsList 
              documents={documentsQuery.data ?? []}
              onUpload={handleFileUpload}
              onDelete={handleDocumentDelete}
              onImageClick={handleImageClick}
            />
          )}
        </div>

        {state.isLoading && (
          <div className="flex justify-center items-center my-2">
            <Loader2 className="animate-spin text-gray-500" size={24} />
            <span className="ml-2 text-gray-500 text-sm">Laster opp filer...</span>
          </div>
        )}
      </div>

      <div className="w-full md:ml-16" data-cy="right-column">
        <div>
          <h1 className="text-xl font-medium">Sørg for at:</h1>
          {renderDocumentRequirements}
        </div>

        <Results
          results={state.results} 
          existingDocuments={documentsQuery.data ?? []}
        />

        {state.errorMessage && (
          <div className="mb-4 rounded mt-2 bg-red-100 p-2 text-red-700" role="alert">
            {state.errorMessage}
          </div>
        )}

        {state.successMessage && (
          <div className="mb-4 rounded mt-2 bg-green-100 p-2 text-green-700" role="alert">
            {state.successMessage}
          </div>
        )}

        <InvalidFilesList 
          invalidFiles={state.invalidFiles}
          onRemove={handleFileRemove}
        />
      </div>
      
      {state.imageSrc && (
        <div 
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50 px-8 
          transition-opacity duration-100 ease-in-out" 
          onClick={closeFullSizeImage}
        >
          <div 
            className="relative transform transition-all duration-100 ease-in-out opacity-0 animate-fadeIn" 
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={state.imageSrc}
              alt="Full Size"
              className="max-w-full max-h-full"
              width={500}
              height={500}
            />
            <X 
              className="cursor-pointer absolute top-[-36px] right-[-36px] text-white rounded-full p-2 
              hover:bg-white/10 transition-colors duration-200" 
              size={42} 
              onClick={closeFullSizeImage} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CadaidAtlas;