"use client";
import React, { useState } from "react";
import Results from "./Results";
import type { Detection } from "~/types/detection";
import { api } from "~/trpc/react";
import { useSession } from "next-auth/react";
import ExistingDocumentsList from './ExistingDocumentsList';
import InvalidFilesList from './InvalidFilesList';

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
  // State management for UI feedback and file processing
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [results, setResults] = useState<Detection[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [invalidFiles, setInvalidFiles] = useState<{ file: File; base64: string }[]>([]);
  
  // Authentication and API utilities
  const { data: session } = useSession();
  const utils = api.useUtils();
  
  type FileDetection = {
    drawing_type: string[];
    file_name: string;
  };

  // Query for fetching user's existing documents
  const documentsQuery = api.userDocuments.getUserDocuments.useQuery(undefined, {
    staleTime: 1000,
  });

  // Mutation for saving new document detections
  
  const saveResultsMutation = api.userDocuments.saveDetectionResults.useMutation({
    onSuccess: async () => {
      await utils.userDocuments.getUserDocuments.invalidate();
      setResults([]);
    }
  });

  // Mutation for checking if file already exists
  const checkExistingFile = api.userDocuments.checkFileExists.useMutation();

  // Handlers for file processing
  const handleFileRemove = (index: number) => {
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
  };

  // Handle successful file detection
  const handleValidFile = async (file: File, fileDetections: FileDetection[], base64: string) => {
    const result = await saveResultsMutation.mutateAsync({
      fileName: file.name,
      fileType: file.type,
      detectionResults: fileDetections,
      document: base64,
    });

    if (!result.success) {
      setInvalidFiles(prev => [...prev, { file, base64 }]);
      setErrorMessage(prev => 
        prev ? `${prev}\n${result.message}: ${file.name}` 
             : `${result.message}: ${file.name}`
      );
    }
  };

  // Handle files with no valid drawing types
  const handleInvalidFile = (file: File, base64: string) => {
    setInvalidFiles(prev => [...prev, { file, base64 }]);
    setErrorMessage(prev => 
      prev ? `${prev}\n${file.name} has no valid drawing types` 
           : `${file.name} has no valid drawing types`
    );
  };

  // Main file upload handler
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!session?.user?.id) {
      setErrorMessage("You must be logged in to upload files");
      return;
    }

    // Replace || with ?? for nullish coalescing
    const uploadedFiles = Array.from(event.target.files ?? []);
    if (uploadedFiles.length === 0) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
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

  const deleteDocumentMutation = api.userDocuments.deleteDocument.useMutation({
    onSuccess: () => {
      utils.userDocuments.getUserDocuments.invalidate();
    },
  });

  const handleDocumentDelete = async (documentId: number) => {
    try {
      await deleteDocumentMutation.mutateAsync({ documentId });
    } catch (error) {
      console.error('Error deleting document:', error);
      setErrorMessage('Failed to delete document');
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
              documents={documentsQuery.data ?? []}
              onUpload={handleFileUpload}
              onDelete={handleDocumentDelete}
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

        <InvalidFilesList 
          invalidFiles={invalidFiles}
          onRemove={handleFileRemove}
        />

        <Results 
          results={results} 
          existingDocuments={documentsQuery.data ?? []} 
        />
      </div>
    </div>
  );
};

export default CadaidAtlas;
