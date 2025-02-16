"use client";

import React, { useState } from "react";
//import FileList from "./FileList";
import Results from "./Results";
//import FilePreview from "./FilePreview";
import type { Detection } from "~/types/detection";
import { api } from "~/trpc/react";
import { useSession } from "next-auth/react";
//import DocumentItem from "./DocumentItem";
import ExistingDocumentsList from './ExistingDocumentsList';

async function fetchDetection(formData: FormData): Promise<Detection[]> {
  const response = await fetch("http://127.0.0.1:5001/detect", {
    method: "POST",
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error("Failed to upload files");
  }
  
  return response.json() as Promise<Detection[]>;
}

const CadaidAtlas: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [results, setResults] = useState<Detection[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: session } = useSession();
  const utils = api.useContext();
  
  // Add staleTime to reduce unnecessary refetches
  const documentsQuery = api.userDocuments.getUserDocuments.useQuery(undefined, {
    staleTime: 1000,
  });

  const saveResultsMutation = api.userDocuments.saveDetectionResults.useMutation({
    onSuccess: () => {
      utils.userDocuments.getUserDocuments.invalidate();
      setResults([]); // Clear results after successful save
    }
  });

  const checkExistingFile = api.userDocuments.checkFileExists.useMutation();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!session?.user?.id) {
      setErrorMessage("You must be logged in to upload files");
      return;
    }

    const uploadedFiles = Array.from(event.target.files || []);
    if (uploadedFiles.length === 0) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Process all files in parallel
      const filesToProcess = await Promise.all(
        uploadedFiles.map(async (file) => {
          const existingFile = await checkExistingFile.mutateAsync({
            fileName: file.name,
            userID: session.user.id
          });

          if (existingFile.exists) {
            const confirmReplace = window.confirm(
              `File ${file.name} already exists. Do you want to replace it?`
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

      // Process files in parallel
      await Promise.all(
        validFiles.map(async (file) => {
          try {
            const base64 = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });

            const fileDetections = detections.filter(d => d.file_name === file.name);
            await saveResultsMutation.mutateAsync({
              fileName: file.name,
              fileType: file.type,
              detectionResults: fileDetections,
              document: base64,
            });
          } catch (error) {
            console.error(`Error processing file ${file.name}:`, error);
            setErrorMessage(prev => 
              prev ? `${prev}\nFailed to process: ${file.name}` : `Failed to process: ${file.name}`
            );
          }
        })
      );
    } catch (error) {
      console.error('Upload error:', error);
      setErrorMessage("Error uploading files");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen p-6" data-cy="main-container">
      <div className="w-full md:pr-4" data-cy="left-column">
        <h1 className="mb-5 mt-10 text-left text-3xl font-bold">CADAiD</h1>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Your Documents</h2>
          {documentsQuery.isLoading ? (
            <div>Loading documents...</div>
          ) : documentsQuery.error ? (
            <div className="text-red-500">Error loading documents</div>
          ) : (
            <ExistingDocumentsList 
              documents={documentsQuery.data || []}
              onUpload={handleFileUpload}
            />
          )}
        </div>

        {isLoading && (
          <div className="mb-4 flex items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 rounded bg-red-100 p-2 text-red-700" role="alert">
            {errorMessage}
          </div>
        )}

        <Results 
          results={results} 
          existingDocuments={documentsQuery.data || []} 
        />
      </div>
    </div>
  );
};

export default CadaidAtlas;
