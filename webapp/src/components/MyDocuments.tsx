"use client"

import React, { useState } from 'react'
import { Download, Eye, Info, Repeat, Trash2 } from 'lucide-react';
import { api } from "~/trpc/react";
import { ApplicationType } from "@prisma/client";
import { toast } from "react-hot-toast";
import { APPLICATION_TYPE_DISPLAY_NAMES } from "~/utils/applicationTypes";

const MyDocuments = () => {
    const [openModal, setOpenModal] = useState<boolean>(false);
  
    const handleOpenModal = () => setOpenModal(true);
    const handleCloseModal = () => setOpenModal(false);

      const { 
        data: applications, 
        isLoading, 
        error, 
        refetch
      } = api.application.getAllApplications.useQuery();
      
      // Delete mutation
      const deleteApplication = api.application.deleteApplication.useMutation({
        onSuccess: () => {
          toast.success("Søknaden ble slettet.");
          refetch();
        },
        onError: (error) => {
          toast.error(`Error: ${error.message}`);
        }
      });
      
      // Delete handler with confirmation
      const handleDeleteApplication = (applicationID: number) => {
        if (confirm("Er du sikker på at du vil slette denne søknaden? Dette kan ikke angres.")) {
          deleteApplication.mutate({ applicationID });
        }
      };
    
      // Loading state
      if (isLoading) {
        return (
          <div className="p-4">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          </div>
        );
      }
    
      // Error state
      if (error) {
        return (
          <div className="p-4">
            <div className="bg-red-100 p-4 rounded-md text-red-700">
              Error loading applications: {error.message}
            </div>
          </div>
        );
      }
    
      // Format date helper function
      const formatDate = (dateString: Date) => {
        return new Date(dateString).toLocaleDateString('nb-NO', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      };

  return (
    <div className='p-4'>
      <h1 className='text-3xl pt-4 font-bold flex justify-center text-kartAI-blue mb-8'>Mine Dokumenter
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
      <p className="text-xl md:mx-20 px-6 mb-4 flex justify-center">Her finner du alle dokumentene du har lastet 
        opp til søknadene dine. Du kan se, laste ned, eller erstatte filer, og legge til nye dokumenter ved behov.
      </p>
      <div className='p-4'>
        {applications && applications.length > 0 ? (
                <div className="space-y-4 px-6 py-6 rounded-lg md:mx-20 bg-white">
                  {applications.map((application) => (
                    <div key={application.applicationID} className="border bg-white rounded-md p-4 shadow-sm hover:bg-gray-100">
                      <div className="flex gap-x-2">
                        
                        <h2 className="text-lg font-semibold">
                          SAK{application.applicationID} - {APPLICATION_TYPE_DISPLAY_NAMES[application.applicationType as ApplicationType]}
                        </h2>
                      </div>
                      <div className="border border-gray-300 my-2" />
                      <div className="overflow-x-auto">
  <table className="w-full table-auto text-left border-separate ">
    <thead>
      <tr className="font-medium">
        <th className="w-1/4">Fil</th>
        <th className="w-1/4">Kategori</th>
        <th className="w-1/4">Dato: {formatDate(application.submissionDate)}</th>
        <th className="w-1/4">Handlinger</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td className="w-1/4">[FILNAVN]</td>
        <td className="w-1/4">[FILKATEGORI]</td>
        <td className="w-1/4 whitespace-nowrap">Dato: [DATO VED OPPLASTING AV FIL]</td>
        <td className="w-1/4">
          <div className="flex items-center gap-2 space-x-2">
            <Eye size={20} className="text-gray-500 hover:text-gray-700 cursor-pointer" />
            <Repeat size={20} className="text-gray-500 hover:text-gray-700 cursor-pointer" />
            <button
              onClick={() => handleDeleteApplication(application.applicationID)}
              disabled={deleteApplication.isPending && deleteApplication.variables?.applicationID === application.applicationID}
              className={`text-red-500 hover:text-red-700 p-1 rounded transition-colors ${
                deleteApplication.isPending && deleteApplication.variables?.applicationID === application.applicationID
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
              title="Delete application"
            >
              {deleteApplication.isPending && deleteApplication.variables?.applicationID === application.applicationID ? (
                <div className="w-4 h-4 border-t-2 border-red-500 rounded-full animate-spin"></div>
              ) : (
                <Trash2 size={20} />
              )}
            </button>
            <Download size={20} className="text-gray-500 hover:text-gray-700 cursor-pointer" />
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-100 p-6 text-center rounded-md md:mx-20">
                  <p className="text-gray-500">Du har ingen dokumenter enda.</p>
                  <p className="mt-4">Trykk på <span className="font-medium">"Lag ny Byggesøknad"</span>  for å starte.</p>
                </div>
              )}
            </div>

      </div>
  )
}

export default MyDocuments
