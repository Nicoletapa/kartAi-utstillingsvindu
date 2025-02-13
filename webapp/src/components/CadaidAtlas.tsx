"use client";

import React, { useState } from "react";
import FileList from "./FileList";
import Results from "./Results";
import FilePreview from "./FilePreview";
import type { Detection } from "~/types/detection";
import { api } from "~/trpc/react";
import { useSession } from "next-auth/react";

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
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<Detection[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Get session data
  const { data: session } = useSession();

  // tRPC mutations
  const saveResultsMutation = api.userDocuments.saveDetectionResults.useMutation();
  const checkExistingFile = api.userDocuments.checkFileExists.useMutation();

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!session?.user?.id) {
      setErrorMessage("You must be logged in to upload files");
      return;
    }

    if (event.target.files) {
      const uploadedFiles = Array.from(event.target.files);
      if (uploadedFiles.length === 0) {
        setErrorMessage("No files selected");
        return;
      }
  
      setIsLoading(true);
      try {
        // Check for existing files before processing
        for (const file of uploadedFiles) {
          const existingFile = await checkExistingFile.mutateAsync({
            fileName: file.name,
            userID: session.user.id
          });
  
          if (existingFile.exists) {
            const confirmReplace = window.confirm(
              `File ${file.name} already exists. Do you want to replace it?`
            );
            if (!confirmReplace) {
              continue; // Skip this file
            }
          }
        }
  
        setFiles(prevFiles => [...prevFiles, ...uploadedFiles]);
  
        // First, send to detection service
        const formData = new FormData();
        uploadedFiles.forEach((file) => {
          formData.append("uploaded_files", file);
        });
  
        const detections = await fetchDetection(formData);
        setResults((prevResults) => [...prevResults, ...detections]);
  
        // Process files sequentially
        for (const file of uploadedFiles) {
          try {
            const base64 = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                const result = reader.result as string;
                resolve(result);
              };
              reader.onerror = () => reject(reader.error);
              reader.readAsDataURL(file);
            });
  
            const fileDetections = detections.filter(d => d.file_name === file.name);
            
            await saveResultsMutation.mutateAsync({
              fileName: file.name,
              fileType: file.type,
              detectionResults: fileDetections,
              document: base64,
            });
  
            console.log(`Successfully processed file: ${file.name}`);
          } catch (error) {
            console.error(`Error processing file ${file.name}:`, error);
            setErrorMessage(`Failed to process file: ${file.name}`);
          }
        }
      } catch (error) {
        console.error('Upload error:', error);
        setErrorMessage("En feil oppsto under opplasting av filer.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Rest of your component remains the same...
  const handleFileRemove = (fileName: string) => {
    setFiles((prevFiles) => prevFiles.filter((file) => file.name !== fileName));
    setResults((prevResults) =>
      prevResults.filter((result) => result.file_name !== fileName),
    );
  };

  return (
    <div
      className="flex min-h-screen flex-col p-6 md:flex-row"
      data-cy="main-container"
    >
      {/* Left Column */}
      <div className="w-full md:w-1/3 md:pr-4" data-cy="left-column">
        <h1 className="mb-5 mt-10 text-left text-3xl font-bold">CADAiD</h1>
        <span className="my-10 text-left text-xl">
          Her kan du laste opp og verifisere plantegningene dine.
        </span>
        <FileList
          files={files}
          onRemove={handleFileRemove}
          onUpload={handleFileUpload}
        />

        {isLoading && (
          <div className="mb-4 flex items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
          </div>
        )}

        {errorMessage && (
          <div
            className="mb-4 rounded bg-red-100 p-2 text-red-700"
            role="alert"
            aria-live="assertive"
            data-cy="submission-validation"
          >
            {errorMessage}
          </div>
        )}

        <Results results={results} />
      </div>

      {/* Right Column */}
      <div className="w-full pt-10 md:w-2/3" data-cy="right-column">
        <FilePreview files={files} />
      </div>
    </div>
  );
};

export default CadaidAtlas;
