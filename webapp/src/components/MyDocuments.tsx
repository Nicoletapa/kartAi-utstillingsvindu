"use client"

import React, { useState } from 'react'
import { Download, Eye, Info, Repeat, Trash2, Loader2 } from 'lucide-react'
import { api } from "~/trpc/react"
import { ApplicationType } from "@prisma/client"
import { toast } from "react-hot-toast"
import { APPLICATION_TYPE_DISPLAY_NAMES } from "~/utils/applicationTypes"

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

const MyDocuments: React.FC<MyDocumentsProps> = ({ existingDocuments = [] }) => {
  const [openModal, setOpenModal] = useState<boolean>(false)
  const [replaceDocumentId, setReplaceDocumentId] = useState<number | null>(null)
  const [fileToUpload, setFileToUpload] = useState<File | null>(null)

  const handleOpenModal = () => setOpenModal(true)
  const handleCloseModal = () => setOpenModal(false)

  const { 
    data: applications, 
    isLoading, 
    error, 
    refetch: refetchApplications
  } = api.application.getAllApplications.useQuery()

  // Fetch documents for all applications
  const { data: allDocuments, error: docsError, refetch: refetchDocuments } = api.document.getAllUserDocuments.useQuery()

  if (docsError) {
    console.error('Document fetch error:', docsError)
    return (
      <div className="p-4">
        <div className="bg-red-100 p-4 rounded-md text-red-700">
          Error loading documents: {docsError.message}
        </div>
      </div>
    )
  }
  // Delete mutation
  const deleteDocument = api.document.deleteDocument.useMutation({
    onSuccess: () => {
      toast.success("Dokumentet ble slettet.")
      refetchDocuments()
    },
    onError: (error) => {
      toast.error(`Feil ved sletting: ${error.message}`)
    }
  })

  // Replace mutation
  const replaceDocument = api.document.replaceDocument.useMutation({
    onSuccess: () => {
      toast.success("Dokumentet ble oppdatert.")
      setReplaceDocumentId(null)
      setFileToUpload(null)
      refetchDocuments()
    },
    onError: (error) => {
      toast.error(`Feil ved oppdatering: ${error.message}`)
    }
  })

  // Format date helper function
  const formatDate = (dateString: Date) => {
    return new Date(dateString).toLocaleDateString('nb-NO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleDeleteDocument = async (documentId: number) => {
    if (confirm("Er du sikker på at du vil slette dette dokumentet? Dette kan ikke angres.")) {
      try {
        await deleteDocument.mutateAsync(
          { documentId },
          {
            onSuccess: (data) => {
              toast.success(`Dokument ${data.deletedFileName} ble slettet`);
              void refetchDocuments();
              if (data.applicationID) {
                void refetchApplications();
              }
            },
            onError: (error) => {
              toast.error(`Feil ved sletting: ${error.message}`);
            }
          }
        );
      } catch (error) {
        console.error('Delete error:', error);
        toast.error('En uventet feil oppstod ved sletting');
      }
    }
  };

  // Handle file upload for replacement
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileToUpload(e.target.files[0])
    }
  }

  // Handle document replacement
  const handleReplaceDocument = async (documentId: number) => {
    if (!fileToUpload) return;
  
    try {
      const arrayBuffer = await fileToUpload.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
  
      await replaceDocument.mutateAsync(
        {
          documentId,
          file: uint8Array,
          fileName: fileToUpload.name,
          applicationID: undefined,
        },
        {
          onSuccess: (data) => {
             {
              toast.success('Document replaced but could not validate');
            }
            setReplaceDocumentId(null);
            setFileToUpload(null);
          },
          onError: (error) => {
            // Check if it's a partial success (file replaced but validation failed)
            if (error.message.includes('File was replaced but could not validate')) {
              toast(error.message, { icon: '⚠️' });
              void refetchDocuments();
            } else {
              toast.error(`Replacement failed: ${error.message}`);
            }
          }
        }
      );
    } catch (error) {
      console.error('File processing error:', error);
      toast.error('Failed to process file');
    }
  };

  // Handle document download
  const handleDownloadDocument = (doc: { fileName: string, document: number[] }) => {
      try {
        const byteArray = new Uint8Array(doc.document)
        const blob = new Blob([byteArray], { type: 'application/octet-stream' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = doc.fileName
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } catch (error) {
        console.error('Download error:', error)
        toast.error('Failed to download document')
      }
    }

  // Loading state
  if (isLoading) {
    return (
      <div className="p-4">
        <div className="flex justify-center">
        <Loader2 className="animate-spin text-gray-500" size={24} />
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-100 p-4 rounded-md text-red-700">
          Feil ved lasting av søknader: {error.message}
        </div>
      </div>
    )
  }

  return (
    <div className='p-4'>
      <h1 className='text-3xl pt-4 font-bold flex justify-center text-kartAI-blue mb-8'>
        Mine Dokumenter
        <Info size={18} className="ml-2 hover:cursor-pointer text-kartAI-blue" onClick={handleOpenModal} />
      </h1>
      
      {openModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" onClick={handleCloseModal}>
          <div className="bg-white mx-80 p-6 rounded-lg shadow-lg w-full transform transition-all scale-95 opacity-0 animate-fadeIn"
            onClick={(e) => e.stopPropagation()}>
            <div className="mb-8">
              <h1 className="text-xl font-medium">Mine Dokumenter</h1>
              <p className='mt-2'>Hvordan fungerer det?</p>
              <ul className='list-disc pl-7 mt-2 space-y-1'>
                <li>Dokumentene er sortert etter hvilken søknad de tilhører</li>
                <li>Du ser statusen på hvert dokument (godkjent, under vurdering, mangler)</li>
                <li>Du kan laste opp nye eller oppdaterte versjoner av dokumentet</li>
                <li>Du kan fjerne dokumenter som ikke lenger skal være med</li>
              </ul>
            </div>
            <button className="absolute mt-4 px-4 py-2 right-3 bottom-3 bg-gray-400 text-white rounded hover:bg-gray-500 transition"
              onClick={handleCloseModal}>
              Lukk
            </button>
          </div>
        </div>
      )}

      <p className="text-xl md:mx-20 px-6 mb-4 flex justify-center">
        Her finner du alle dokumentene du har lastet opp til søknadene dine. 
        Du kan se, laste ned, eller erstatte filer, og legge til nye dokumenter ved behov.
      </p>

      <div className='p-4'>
        {applications && applications.length > 0 ? (
          <div className="space-y-4 px-6 py-6 rounded-lg md:mx-20 bg-white">
            {applications.map((application) => {
              const applicationDocuments = allDocuments?.filter(doc => doc.applicationID === application.applicationID) || []
              
              return (
                <div key={application.applicationID} className="border bg-white rounded-md p-4 shadow-sm hover:bg-gray-100">
                  <div className="flex gap-x-2">
                    <h2 className="text-lg font-semibold">
                      SAK{application.applicationID} - {APPLICATION_TYPE_DISPLAY_NAMES[application.applicationType as ApplicationType]}
                    </h2>
                  </div>
                  <div className="border border-gray-300 my-2" />
                  
                  {applicationDocuments.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full table-auto text-left border-separate">
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
          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
        >
          {validation.drawingType}
        </span>
      ))}
    </div>
  ) : (
    <span className="text-gray-500">Ikke validert</span>
  )}
</td>
                              <td className="w-1/4 whitespace-nowrap">
                                {formatDate(document.createdAt)}
                              </td>
                              <td className="w-1/4">
                                <div className="flex items-center gap-2 space-x-2">
                                  <Eye 
                                    size={20} 
                                    className="text-gray-500 hover:text-gray-700 cursor-pointer" 
                                    onClick={() => {/* Implement preview logic */}}
                                  />
                                  <Repeat 
                                    size={20} 
                                    className="text-gray-500 hover:text-gray-700 cursor-pointer" 
                                    onClick={() => setReplaceDocumentId(document.documentID)}
                                  />
                                  <button
                                    onClick={() => {
                                      if (confirm("Er du sikker på at du vil slette dette dokumentet?")) {
                                        deleteDocument.mutate({ documentId: document.documentID })
                                      }
                                    }}
                                    disabled={deleteDocument.isPending && deleteDocument.variables?.documentId === document.documentID}
                                    className={`text-red-500 hover:text-red-700 p-1 rounded transition-colors ${
                                      deleteDocument.isPending && deleteDocument.variables?.documentId === document.documentID
                                        ? 'opacity-50 cursor-not-allowed'
                                        : ''
                                    }`}
                                    title="Slett dokument"
                                  >
                                    {deleteDocument.isPending && deleteDocument.variables?.documentId === document.documentID ? (
                                      <div className="w-4 h-4 border-t-2 border-red-500 rounded-full animate-spin"></div>
                                    ) : (
                                      <Trash2 size={20} />
                                    )}
                                  </button>
                                  <Download 
                                    size={20} 
                                    className="text-gray-500 hover:text-gray-700 cursor-pointer" 
                                    onClick={() => handleDownloadDocument({
                                      fileName: document.fileName,
                                      document: Array.from(document.document)
                                    })}
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
                                      onClick={() => handleReplaceDocument(document.documentID)}
                                      disabled={replaceDocument.isPending}
                                      className="bg-blue-500 text-white px-2 py-1 rounded text-sm"
                                    >
                                      {replaceDocument.isPending ? 'Laster opp...' : 'Erstatt'}
                                    </button>
                                    <button
                                      onClick={() => setReplaceDocumentId(null)}
                                      className="bg-gray-500 text-white px-2 py-1 rounded text-sm"
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
                    <div className="text-center py-4 text-gray-500">
                      Ingen dokumenter for denne søknaden ennå.
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-gray-100 p-6 text-center rounded-md md:mx-20">
            <p className="text-gray-500">Du har ingen søknader enda.</p>
            <p className="mt-4">Trykk på <span className="font-medium">"Lag ny Byggesøknad"</span> for å starte.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default MyDocuments