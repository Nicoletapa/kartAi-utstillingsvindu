"use client";

import React, { useState, useCallback, useEffect } from "react";

import Results from "./Results";
import type { Detection } from "~/types/detection";
import { api } from "~/trpc/react";
import { useSession } from "next-auth/react";
import ExistingDocumentsList from './ExistingDocumentsList';
import InvalidFilesList from './InvalidFilesList';
import { X, Info, Loader2 } from 'lucide-react';
import Image from "next/image";
import { skipToken } from "@tanstack/react-query";

interface CadaidAtlasProps {
  applicationID?: number;
}

interface FileDetection {
  drawing_type: string[];
  file_name: string;
}

// Utility functions for file processing
const processFile = async (file: File, detections: Detection[]) => {
  // Convert file to base64 for storage and preview
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  // Process detections for the specific file
  const fileDetections = detections
    .filter(d => d.file_name === file.name)
    .map(d => ({
      drawing_type: Array.isArray(d.drawing_type) ? d.drawing_type : [],
      file_name: d.file_name
    }));
  
  return { base64, fileDetections };
};

// API call to ML model for drawing type detection
async function fetchDetection(formData: FormData): Promise<Detection[]> {
  try {
    const response = await fetch("http://127.0.0.1:5001/detect", {
      method: "POST",
      body: formData,
    });
    
    if (!response.ok) {
      console.error("ML API Error:", await response.text());
      throw new Error(`API error: ${response.status}`);
    }
    
    return response.json() as Promise<Detection[]>;
  } catch (error) {
    console.error("Fetch detection error:", error);
    throw error;
  }
}

const CadaidAtlas: React.FC<CadaidAtlasProps> = ({applicationID}) => {
  console.log("CadaidAtlas received applicationID:", applicationID);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<Detection[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [invalidFiles, setInvalidFiles] = useState<{ file: File; base64: string }[]>([]);
  const [fullSizeImage, setFullSizeImage] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  const handleOpenModal = useCallback(() => setOpenModal(true), []);
  const handleCloseModal = useCallback(() => setOpenModal(false), []);
  const handleImageClick = useCallback((imageSrc: string) => {
    setFullSizeImage(imageSrc);
  }, []);
  const closeFullSizeImage = useCallback(() => {
    setFullSizeImage(null);
  }, []);

  // Authentication and API utilities
  const { data: session } = useSession();
  const utils = api.useUtils();

  // Query for fetching user's existing documents
  const documentsQuery = api.userDocuments.getUserDocuments.useQuery(
    applicationID !== undefined ? { applicationID } : skipToken, 
    { staleTime: 1000 * 60 }
  );

  
  const saveResultsMutation = api.userDocuments.saveDetectionResults.useMutation({
    onSuccess: () => {
      void utils.userDocuments.getUserDocuments.invalidate({
        applicationID: applicationID
      });
      setResults([]);
      setSuccessMessage("Dokumenter ble lastet opp");
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    onError: (error) => {
      console.error("Error saving detection results:", error);
      setErrorMessage(`Failed to save document: ${error.message}`);
    }
  });

  // Mutation for checking if file already exists
  const checkExistingFile = api.userDocuments.replaceExistingFile.useMutation();

  // Handlers for file processing
  const handleFileRemove = useCallback((index: number) => {
    const fileToRemove = invalidFiles[index]?.file.name;
    if (fileToRemove) {
      setInvalidFiles(prev => prev.filter((_, i) => i !== index));
      setResults(prev => prev.filter(result => result.file_name !== fileToRemove));
      setErrorMessage(prev => {
        if (!prev) return null;
        const errors = prev.split('\n').filter(error => !error.includes(fileToRemove));
        return errors.length > 0 ? errors.join('\n') : null;
      });
    }
  }, [invalidFiles]);

  // Handle successful file detection
  const handleValidFile = async (file: File, fileDetections: FileDetection[], base64: string) => {
    const result = await saveResultsMutation.mutateAsync({
      fileName: file.name,
      fileType: file.type,
      detectionResults: fileDetections,
      document: base64,
      applicationID: applicationID,
    });

    if (!result.success) {
      setInvalidFiles(prev => [...prev, { file, base64 }]);
      
      // Check if message property exists before using it
      const errorMsg = 'message' in result 
        ? result.message 
        : 'Kunne ikke lagre dokumentet';
        
      setErrorMessage(prev => 
        prev ? `${prev}\n${errorMsg}: ${file.name}` 
             : `${errorMsg}: ${file.name}`
      );
    }
  };

  // Handle files with no valid drawing types
  const handleInvalidFile = (file: File, base64: string) => {
    setInvalidFiles(prev => [...prev, { file, base64 }]);
    setErrorMessage(prev => 
      prev ? `${prev}\n${file.name} har ingen gyldige tegningstyper` 
           : `${file.name} har ingen gyldige tegningstyper`
    );
  };

  // Main file upload handler
  const handleFileUpload = async (uploadedFiles: File[]) => {
    // If already processing files, don't start another process
    if (isProcessing || isLoading) {
      console.log("Already processing files, ignoring duplicate call");
      return;
    }
    
    console.log(`handleFileUpload called with ${uploadedFiles.length} files`);
    
    if (!session?.user?.id) {
      setErrorMessage("Du må være logget inn for å laste opp dokumenter");
      return;
    }
    if (!applicationID) {
      setErrorMessage("Kunne ikke laste opp dokumenter");
      return;
    }
    
    if (uploadedFiles.length === 0) return;

    // Set processing flag to prevent duplicate calls
    setIsProcessing(true);
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const filesToProcess = await Promise.all(
        uploadedFiles.map(async (file) => {
          const existingFile = await checkExistingFile.mutateAsync({
            fileName: file.name,
            applicationID: applicationID,
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
        setIsLoading(false);
        return;
      }

      const formData = new FormData();
      validFiles.forEach(file => formData.append("uploaded_files", file));

      const detections = await fetchDetection(formData);
      setResults(detections);

      await Promise.all(
        validFiles.map(async (file) => {
          try {
            const { base64, fileDetections } = await processFile(file, detections);
            console.log("File detections for", file.name, ":", fileDetections);
            
            // Check if ANY drawing types are found (not necessarily valid ones)
            if (fileDetections.some(d => d.drawing_type.length > 0)) {
              await handleValidFile(file, fileDetections, base64);
            } else {
              handleInvalidFile(file, base64);
            }
          } catch (error) {
            console.error(`Error processing file ${file.name}:`, error);
            setErrorMessage(prev => 
              prev ? `${prev}\nKlarte ikke å behandle: ${file.name}` : `Klarte ikke å behandle: ${file.name}`
            );
          }
        })
      );
    } catch (error) {
      console.error('Upload error:', error);
      setErrorMessage("Kunne ikke laste opp dokumenter");
    } finally {
      setIsLoading(false);
      // Reset processing flag after a small delay to prevent any race conditions
      setTimeout(() => {
        setIsProcessing(false);
      }, 100);
    }
  };

  const deleteDocumentMutation = api.userDocuments.deleteDocument.useMutation({
    onSuccess: () => {
      void utils.userDocuments.getUserDocuments.invalidate();
    },
  });

  const handleDocumentDelete = useCallback(async (documentId: number) => {
    try {
      await deleteDocumentMutation.mutateAsync({ 
        documentId,
        applicationID
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      setErrorMessage('Kunne ikke slette dokumentet');
    }
  }, [deleteDocumentMutation, applicationID]);

  useEffect(() => {
    if (fullSizeImage?.startsWith('data:image/')) {
      const blob = fetch(fullSizeImage)
        .then(res => res.blob())
        .then(blob => URL.createObjectURL(blob));
      blob.then(setImageSrc);
  } else {
    setImageSrc(fullSizeImage);
  }
}, [fullSizeImage]);

  return (
    <div className="flex min-h-screen p-6 flex-col md:flex-row" data-cy="main-container">
      <div className="w-full md:w-2/3" data-cy="left-column">
        <h1 className="mb-5 text-left text-3xl font-bold">Dokumentsjekk
          <Info size={18} className="cursor-pointer inline-block ml-2 mb-8 text-black" onClick={handleOpenModal}/>
        </h1>

        {openModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" onClick={handleCloseModal}>
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full transform transition-all scale-95 opacity-0 animate-fadeIn"
            onClick={(e) => e.stopPropagation()}>
              <div className="mb-8">
                <h1 className="text-xl font-medium">Hva er Dokumentsjekk?</h1>
                <p className="text-sm mt-2">
                  Dokumentsjekk er et verktøy som lar deg laste opp dokumenter for å sjekke om de inneholder nødvendige tegninger for byggesøknad ved hjelp av kunstig intelligens.
                  <br />Du kan laste opp dokumenter i formatene PDF, DWG, DXF, PNG, JPG, JPEG, TIFF og BMP.
                  <br />Validerte dokumenter vil bli lagret i din bruker for fremtidig bruk. Ugyldige opplastede dokumenter vil bli slettet.
                </p>
              </div>

              <button className="absolute mt-4 px-4 py-2 right-3 bottom-3 bg-gray-400 text-white rounded hover:bg-gray-500 transition"
              onClick={handleCloseModal}>
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

        {isLoading && (
          <div className="flex justify-center items-center my-2">
          <Loader2 className="animate-spin text-gray-500" size={24} />
          <span className="ml-2 text-gray-500 text-sm">Laster opp filer...</span>
      </div>
        )}
        </div>

        <div className="w-full md:ml-16" data-cy="right-column">
          <div>
            <h1 className="text-xl font-medium">Sørg for at:</h1>
            <ul className="text-sm list-disc ml-6 mt-2 space-y-1 text-gray-700">
              <li>Alle tegninger er i <b>målestokk</b> og <b>målsatte</b></li>
              <li>Plantegningene må oppgi <b>hvor store</b> rommene er og <b>hva</b> de brukes til</li>
              <li>Fasadetegninger må vise <b>alle sider</b> av bygningen, og terrenget rundt bygningen både <b>før og etter</b> endringen</li>
              <li>Situasjonskartet skal inneholde det du skal <b>bygge eller endre</b>, med <b>mål</b> på korteste avstand og fram til:</li>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Nærmeste bygg på egen eiendom</li>
                  <li>Nærmeste nabobygning</li>
                  <li>Nabogrense</li>
                  <li>Midten av gang-, sykkel- eller bilvei</li>
                </ul>
              <li>Snittegninger må vise <b>snittet</b> på bygningen både på <b>langs og på tvers</b>. Dersom boligen har flere etasjer, må <b>høyden</b> på disse oppgis</li>
            </ul>
          </div>

          <Results
          results={results} 
          existingDocuments={documentsQuery.data ?? []}
        />

        {errorMessage && (
          <div className="mb-4 rounded mt-2 bg-red-100 p-2 text-red-700" role="alert">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 rounded mt-2 bg-green-100 p-2 text-green-700" role="alert">
            {successMessage}
          </div>
        )}

        <InvalidFilesList 
          invalidFiles={invalidFiles}
          onRemove={handleFileRemove}
        />
        </div>
        
        

        {imageSrc && (
          <div 
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50 px-8 
            transition-opacity duration-100 ease-in-out" 
            onClick={() => setFullSizeImage(null)}
          >
            <div 
              className="relative transform transition-all duration-100 ease-in-out opacity-0 animate-fadeIn" 
              onClick={(e) => e.stopPropagation()}
            >
            <Image
              src={imageSrc}
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
