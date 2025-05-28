/**
 * This file is used in Utstillingsvindu 2.0
 */

"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import Results from "./Results";
import type { Detection } from "~/types/detection";
import { api } from "~/trpc/react";
import { useSession } from "next-auth/react";
import ExistingDocumentsList from "./ExistingDocumentsList";
import InvalidFilesList from "./InvalidFilesList";
import { X, Info } from "lucide-react";
import Image from "next/image";
import { skipToken } from "@tanstack/react-query";
import { appendErrorMessage } from "~/utils/errorMessage";
import { tooltipInfo } from "~/utils/tooltipInfo";
import { LoadingIndicator } from "./ui/loading-indicator";

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
      "Midten av gang-, sykkel- eller bilvei",
    ],
  },
  {
    text: "Snittegninger må vise snittet på bygningen både på langs og på tvers. Dersom boligen har flere etasjer, må høyden på disse oppgis",
  },
];

const processFile = async (
  file: File,
  detections: Detection[],
): Promise<{ base64: string; fileDetections: FileDetection[] }> => {
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const fileDetections = detections
    .filter((d) => d.file_name === file.name)
    .map((d) => ({
      drawing_type: Array.isArray(d.drawing_type) ? d.drawing_type : [],
      file_name: d.file_name,
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

    return (await response.json()) as Detection[];
  } catch (error) {
    console.error("Fetch detection error:", error);
    throw error;
  }
};

const CadaidAtlas: React.FC<CadaidAtlasProps> = ({ applicationID }) => {
  const [state, setState] = useState({
    isProcessing: false,
    results: [] as Detection[],
    errorMessage: null as string | null,
    successMessage: null as string | null,
    invalidFiles: [] as InvalidFile[],
    fullSizeImage: null as string | null,
    openModal: false,
    imageSrc: null as string | null,
  });

  const { data: session } = useSession();
  const utils = api.useUtils();

  const documentsQuery = api.userDocuments.getUserDocuments.useQuery(
    applicationID !== undefined ? { applicationID } : skipToken,
    { staleTime: 1000 * 60 },
  );

  const mutations = {
    saveResults: api.userDocuments.saveDetectionResults.useMutation({
      onSuccess: () => {
        void utils.userDocuments.getUserDocuments.invalidate({ applicationID });
        setState((prev) => ({
          ...prev,
          results: [],
          successMessage: "Dokumenter ble lastet opp",
          errorMessage: null,
        }));
        setTimeout(
          () => setState((prev) => ({ ...prev, successMessage: null })),
          3000,
        );
      },
      onError: (error) => {
        console.error("Error saving detection results:", error);
        setState((prev) => ({
          ...prev,
          errorMessage: `Failed to save document: ${error.message}`,
        }));
      },
    }),
    checkExistingFile: api.userDocuments.checkFileExists.useMutation(),
    deleteDocument: api.userDocuments.deleteDocument.useMutation({
      onSuccess: () => void utils.userDocuments.getUserDocuments.invalidate(),
    }),
  };

  const handleModal = useCallback((open: boolean) => {
    setState((prev) => ({ ...prev, openModal: open }));
  }, []);

  const handleImageClick = useCallback((imageSrc: string) => {
    setState((prev) => ({ ...prev, fullSizeImage: imageSrc }));
  }, []);

  const closeFullSizeImage = useCallback(() => {
    setState((prev) => ({ ...prev, fullSizeImage: null }));
  }, []);

  const handleFileRemove = useCallback((index: number) => {
    setState((prev) => {
      const fileToRemove = prev.invalidFiles[index]?.file.name;
      if (!fileToRemove) return prev;

      return {
        ...prev,
        invalidFiles: prev.invalidFiles.filter((_, i) => i !== index),
        results: prev.results.filter(
          (result) => result.file_name !== fileToRemove,
        ),
        errorMessage: prev.errorMessage
          ? prev.errorMessage
              .split("\n")
              .filter((error) => !error.includes(fileToRemove))
              .join("\n") || null
          : null,
      };
    });
  }, []);

  const handleValidFile = useCallback(
    async (file: File, fileDetections: FileDetection[], base64: string) => {
      if (!applicationID) return;

      try {
        const result = await mutations.saveResults.mutateAsync({
          fileName: file.name,
          fileType: file.type,
          detectionResults: fileDetections,
          document: base64,
          applicationID,
        });

        if (!result.success) {
          setState((prev) => ({
            ...prev,
            invalidFiles: [...prev.invalidFiles, { file, base64 }],
            errorMessage: appendErrorMessage(
              prev.errorMessage,
              `${"message" in result ? result.message : "Kunne ikke lagre dokumentet"}: ${file.name}`,
            ),
          }));
        }
      } catch (error) {
        console.error(`Error handling valid file ${file.name}:`, error);
      }
    },
    [applicationID, mutations.saveResults],
  );

  const handleInvalidFile = useCallback((file: File, base64: string) => {
    setState((prev) => ({
      ...prev,
      invalidFiles: [...prev.invalidFiles, { file, base64 }],
      errorMessage: appendErrorMessage(
        prev.errorMessage,
        `${file.name} har ingen gyldige tegningstyper`,
      ),
    }));
  }, []);

  const handleDocumentDelete = useCallback(
    async (documentId: number) => {
      if (!applicationID) return;

      try {
        await mutations.deleteDocument.mutateAsync({
          documentId,
          applicationID,
        });
      } catch (error) {
        console.error("Error deleting document:", error);
        setState((prev) => ({
          ...prev,
          errorMessage: "Kunne ikke slette dokumentet",
        }));
      }
    },
    [applicationID, mutations.deleteDocument],
  );

  const handleFileUpload = useCallback(
    async (uploadedFiles: File[]) => {
      if (state.isProcessing || !session?.user?.id || !applicationID) {
        return;
      }

      if (uploadedFiles.length === 0) return;

      setState((prev) => ({
        ...prev,
        isLoading: true,
        isProcessing: true,
        errorMessage: null,
      }));

      try {
        const filesToProcess = await Promise.all(
          uploadedFiles.map(async (file) => {
            const existingFile = await mutations.checkExistingFile.mutateAsync({
              fileName: file.name,
              applicationID,
            });

            if (existingFile.exists) {
              const confirmReplace = window.confirm(
                `Filen ${file.name} eksisterer allerede. Vil du erstatte denne filen?`,
              );
              return confirmReplace ? file : null;
            }
            return file;
          }),
        );

        const validFiles = filesToProcess.filter(Boolean) as File[];
        if (validFiles.length === 0) {
          setState((prev) => ({ ...prev, isLoading: false }));
          return;
        }

        const formData = new FormData();
        validFiles.forEach((file) => formData.append("uploaded_files", file));

        const detections = await fetchDetection(formData);
        setState((prev) => ({ ...prev, results: detections }));

        await Promise.all(
          validFiles.map(async (file) => {
            try {
              const { base64, fileDetections } = await processFile(
                file,
                detections,
              );

              if (fileDetections.some((d) => d.drawing_type.length > 0)) {
                await handleValidFile(file, fileDetections, base64);
              } else {
                handleInvalidFile(file, base64);
              }
            } catch (error) {
              console.error(`Error processing file ${file.name}:`, error);
              setState((prev) => ({
                ...prev,
                errorMessage: appendErrorMessage(
                  prev.errorMessage,
                  `Kunne ikke prosessere filen ${file.name}`,
                ),
              }));
            }
          }),
        );
      } catch (error) {
        console.error("Upload error:", error);
        setState((prev) => ({
          ...prev,
          errorMessage: "Kunne ikke laste opp dokumenter",
        }));
      } finally {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isProcessing: false,
        }));
      }
    },
    [
      state.isProcessing,

      session?.user?.id,
      applicationID,
      mutations.checkExistingFile,
      handleValidFile,
      handleInvalidFile,
    ],
  );

  useEffect(() => {
    let objectUrl: string | null = null;

    if (state.fullSizeImage) {
      if (state.fullSizeImage.startsWith("data:image/")) {
        fetch(state.fullSizeImage)
          .then((res) => {
            if (!res.ok)
              throw new Error(`Failed to fetch image: ${res.statusText}`);
            return res.blob();
          })
          .then((blob) => {
            objectUrl = URL.createObjectURL(blob);
            setState((prev) => ({ ...prev, imageSrc: objectUrl }));
          })
          .catch((error) => {
            console.error("Error creating object URL from data URI:", error);
            setState((prev) => ({ ...prev, imageSrc: null }));
          });
      } else {
        if (state.imageSrc !== state.fullSizeImage) {
          setState((prev) => ({ ...prev, imageSrc: state.fullSizeImage }));
        }
      }
    } else {
      if (state.imageSrc !== null) {
        setState((prev) => ({ ...prev, imageSrc: null }));
      }
    }

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [state.fullSizeImage]);

  const renderDocumentRequirements = useMemo(
    () => (
      <ul className="ml-6 mt-2 list-disc space-y-1 text-sm text-gray-700">
        {DOCUMENT_REQUIREMENTS.map((item, index) => {
          if (typeof item === "string") {
            return <li key={index}>{item}</li>;
          }
          return (
            <li key={index}>
              {item.text}
              {item.subItems && (
                <ul className="ml-6 list-disc space-y-1">
                  {item.subItems.map((subItem, subIndex) => (
                    <li key={subIndex}>{subItem}</li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    ),
    [],
  );

  return (
    <div
      className="flex min-h-screen flex-col p-6 md:flex-row"
      data-cy="main-container"
    >
      <div className="w-full md:w-2/3" data-cy="left-column">
        <h1 className="mb-5 text-left text-3xl font-bold">
          Dokumentsjekk
          <Info
            size={18}
            className="mb-8 ml-2 inline-block cursor-pointer text-black"
            onClick={() => handleModal(true)}
          />
        </h1>

        {state.openModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            onClick={() => handleModal(false)}
          >
            <div
              className="w-full max-w-2xl scale-95 transform animate-fadeIn rounded-lg bg-white p-6 opacity-0 shadow-lg transition-all"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-8">
                <h1 className="text-xl font-medium">
                  {tooltipInfo.documentCheck.title}
                </h1>
                {tooltipInfo.documentCheck.description.map(
                  (paragraph, index) => (
                    <p key={index} className="mt-2 text-sm">
                      {paragraph}
                    </p>
                  ),
                )}
              </div>
              <button
                className="absolute bottom-3 right-3 mt-4 rounded bg-gray-400 px-4 py-2 text-white transition hover:bg-gray-500"
                onClick={() => handleModal(false)}
              >
                Lukk
              </button>
            </div>
          </div>
        )}

        <div className="mb-6">
          <h2 className="mb-3 text-xl font-semibold">Mine Dokumenter</h2>
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

        {state.isProcessing && (
          <LoadingIndicator text={"Laster opp filer..."} />
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
          <div
            className="mb-4 mt-2 rounded bg-red-100 p-2 text-red-700"
            role="alert"
          >
            {state.errorMessage}
          </div>
        )}

        {state.successMessage && (
          <div
            className="mb-4 mt-2 rounded bg-green-100 p-2 text-green-700"
            role="alert"
          >
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 px-8 transition-opacity duration-100 ease-in-out"
          onClick={closeFullSizeImage}
        >
          <div
            className="relative transform animate-fadeIn opacity-0 transition-all duration-100 ease-in-out"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={state.imageSrc}
              alt="Full Size"
              className="max-h-full max-w-full"
              width={500}
              height={500}
            />
            <X
              className="absolute right-[-36px] top-[-36px] cursor-pointer rounded-full p-2 text-white transition-colors duration-200 hover:bg-white/10"
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
