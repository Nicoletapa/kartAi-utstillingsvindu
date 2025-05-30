/**
 * This file is used in Utstillingsvindu 2.0
 */

"use client";

import React, { useState } from "react";
import { Download, Eye, Info, Repeat, Trash2 } from "lucide-react";
import { api } from "~/trpc/react";
import type { ApplicationType } from "@prisma/client";
import { toast } from "react-hot-toast";
import { APPLICATION_TYPE_DISPLAY_NAMES } from "~/utils/applicationTypes";
import { DocumentPreviewModal } from "./DocumentPreviewModal";
import { InfoModal } from "./InfoModal";
import { tooltipInfo } from "~/utils/tooltipInfo";
import { LoadingIndicator } from "./ui/loading-indicator";

interface ExistingDocument {
  documentID: number;
  fileName: string;
  document: number[];
  applicationID: number | null;
  modelID: number;
  userID: string;
  createdAt: Date;
  validations: {
    id: number;
    documentID: number;
    drawingType: string;
    createdAt: Date;
  }[];
  application: {
    applicationID: number;
    applicationType: ApplicationType;
  } | null;
}

interface MyDocumentsProps {
  existingDocuments?: ExistingDocument[];
}

const formatDate = (date: Date) =>
  new Date(date).toLocaleDateString("nb-NO", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const MyDocuments: React.FC<MyDocumentsProps> = () => {
  const [openModal, setOpenModal] = useState(false);
  const [replaceDocumentId, setReplaceDocumentId] = useState<number | null>(
    null,
  );
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);

  const {
    data: applications,
    isLoading,
    refetch: refetchApplications,
  } = api.application.getAllApplications.useQuery();
  const { data: allDocuments, refetch: refetchDocuments } =
    api.document.getAllUserDocuments.useQuery();

  const [previewDocument, setPreviewDocument] = useState<{
    fileName: string;
    document: number[];
    documentType: string;
  } | null>(null);

  const deleteDocument = api.document.deleteDocument.useMutation({
    onSuccess: () => {
      toast.success("Dokumentet ble slettet.");
      void refetchDocuments();
      void refetchApplications();
    },
    onError: (err) => toast.error(`Feil ved sletting: ${err.message}`),
  });

  const replaceDocument = api.document.replaceDocument.useMutation({
    onSuccess: () => {
      toast.success("Dokumentet ble oppdatert.");
      resetReplacement();
      void refetchDocuments();
    },
    onError: (error) => {
      if (error.message.includes("File was replaced but could not validate")) {
        toast(error.message, { icon: "⚠️" });
        void refetchDocuments();
      } else {
        toast.error(`Erstatning feilet: ${error.message}`);
      }
    },
  });

  const resetReplacement = () => {
    setReplaceDocumentId(null);
    setFileToUpload(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFileToUpload(e.target.files[0]);
    }
  };

  const handleReplaceDocument = async (documentId: number) => {
    if (!fileToUpload) return;
    const buffer = await fileToUpload.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);

    replaceDocument.mutate({
      documentId,
      file: uint8Array,
      fileName: fileToUpload.name,
    });
  };

  const handleDownload = (doc: { fileName: string; document: number[] }) => {
    try {
      const blob = new Blob([new Uint8Array(doc.document)], {
        type: "application/octet-stream",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      toast.error("Kunne ikke laste ned dokumentet.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <LoadingIndicator text="Laster inn dokumenter..." />
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="mb-8 flex justify-center pt-4 text-3xl font-bold text-kartAI-blue">
        Mine Dokumenter
        <Info
          size={18}
          className="ml-2 text-kartAI-blue hover:cursor-pointer"
          onClick={() => setOpenModal(true)}
        />
      </h1>
      <InfoModal
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
        title="Mine Dokumenter"
        descriptionTitle="Hvordan fungerer det?"
        items={tooltipInfo.mineDokumenter}
      />

      {previewDocument && (
        <DocumentPreviewModal
          document={previewDocument}
          onClose={() => setPreviewDocument(null)}
        />
      )}

      <p className="mb-4 flex justify-center px-6 text-xl md:mx-20">
        Her finner du alle dokumentene du har lastet opp til søknadene dine. Du
        kan se, laste ned, eller erstatte filer, og legge til nye dokumenter ved
        behov.
      </p>

      <div className="p-4">
        {applications && applications.length > 0 ? (
          <div className="space-y-4 rounded-lg bg-white px-6 py-6 md:mx-20">
            {applications.map((application) => {
              const applicationDocuments =
                allDocuments?.filter(
                  (doc) => doc.applicationID === application.applicationID,
                ) ?? [];

              return (
                <div
                  key={application.applicationID}
                  className="rounded-md border bg-white p-4 shadow-sm hover:bg-gray-100"
                >
                  <div className="flex gap-x-2">
                    <h2 className="text-lg font-semibold">
                      SAK{application.applicationID} -{" "}
                      {
                        APPLICATION_TYPE_DISPLAY_NAMES[
                          application.applicationType
                        ]
                      }
                    </h2>
                  </div>
                  <div className="my-2 border border-gray-300" />

                  {applicationDocuments.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full table-auto border-separate text-left">
                        <thead>
                          <tr className="font-medium">
                            <th className="w-1/4">Fil</th>
                            <th className="w-1/4">Kategori</th>
                            <th className="w-1/4">Dato opplastet</th>
                            <th className="w-1/4">Handlinger</th>
                          </tr>
                        </thead>
                        <tbody>
                          {applicationDocuments.map((document) => (
                            <tr key={document.documentID}>
                              <td className="w-1/4">{document.fileName}</td>
                              <td className="w-1/4">
                                {document.validations.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {document.validations.map((validation) => (
                                      <span
                                        key={validation.id}
                                        className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800"
                                      >
                                        {validation.drawingType}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-gray-500">
                                    Ikke validert
                                  </span>
                                )}
                              </td>
                              <td className="w-1/4 whitespace-nowrap">
                                {formatDate(document.createdAt)}
                              </td>
                              <td className="w-1/4">
                                <div className="flex items-center gap-2 space-x-2">
                                  <Eye
                                    size={20}
                                    className="cursor-pointer text-gray-500 hover:text-gray-700"
                                    onClick={() => {
                                      setPreviewDocument({
                                        fileName: document.fileName,
                                        document: Array.from(document.document),
                                        documentType:
                                          document.fileName
                                            .split(".")
                                            .pop()
                                            ?.toLowerCase() ?? "",
                                      });
                                    }}
                                  />
                                  <Repeat
                                    size={20}
                                    className="cursor-pointer text-gray-500 hover:text-gray-700"
                                    onClick={() =>
                                      setReplaceDocumentId(document.documentID)
                                    }
                                  />
                                  <button
                                    onClick={() => {
                                      if (
                                        confirm(
                                          "Er du sikker på at du vil slette dette dokumentet?",
                                        )
                                      ) {
                                        deleteDocument.mutate({
                                          documentId: document.documentID,
                                        });
                                      }
                                    }}
                                    disabled={
                                      deleteDocument.isPending &&
                                      deleteDocument.variables?.documentId ===
                                        document.documentID
                                    }
                                    className={`rounded p-1 text-red-500 transition-colors hover:text-red-700 ${
                                      deleteDocument.isPending &&
                                      deleteDocument.variables?.documentId ===
                                        document.documentID
                                        ? "cursor-not-allowed opacity-50"
                                        : ""
                                    }`}
                                    title="Slett dokument"
                                  >
                                    {deleteDocument.isPending &&
                                    deleteDocument.variables?.documentId ===
                                      document.documentID ? (
                                      <div className="h-4 w-4 animate-spin rounded-full border-t-2 border-red-500"></div>
                                    ) : (
                                      <Trash2 size={20} />
                                    )}
                                  </button>
                                  <Download
                                    size={20}
                                    className="cursor-pointer text-gray-500 hover:text-gray-700"
                                    onClick={() =>
                                      handleDownload({
                                        fileName: document.fileName,
                                        document: Array.from(document.document),
                                      })
                                    }
                                  />
                                </div>
                                {replaceDocumentId === document.documentID && (
                                  <div className="mt-2 flex items-center gap-2">
                                    <input
                                      type="file"
                                      onChange={handleFileChange}
                                      className="text-sm"
                                    />
                                    <button
                                      onClick={() =>
                                        handleReplaceDocument(
                                          document.documentID,
                                        )
                                      }
                                      disabled={replaceDocument.isPending}
                                      className="rounded bg-blue-500 px-2 py-1 text-sm text-white"
                                    >
                                      {replaceDocument.isPending
                                        ? "Laster opp..."
                                        : "Erstatt"}
                                    </button>
                                    <button
                                      onClick={() => setReplaceDocumentId(null)}
                                      className="rounded bg-gray-500 px-2 py-1 text-sm text-white"
                                    >
                                      Avbryt
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-4 text-center text-gray-500">
                      Ingen dokumenter for denne søknaden ennå.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-md bg-gray-100 p-6 text-center md:mx-20">
            <p className="text-gray-500">Du har ingen søknader enda.</p>
            <p className="mt-4">
              Trykk på{" "}
              <span className="font-medium">
                &quot;Lag ny Byggesøknad&quot;
              </span>{" "}
              for å starte.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyDocuments;
