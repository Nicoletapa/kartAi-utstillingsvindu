"use client"

import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import { ApplicationType } from "@prisma/client";
import { Trash2, PlusCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import { APPLICATION_TYPE_DISPLAY_NAMES } from "~/utils/applicationTypes";
import { useState } from "react";

const MyApplications = () => {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  
  // Data fetching
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
  
  // Create application mutation
  const createApplication = api.application.createApplication.useMutation({
    onSuccess: (data) => {
      setIsCreating(false);
      
      if (!data?.applicationID) {
        toast.error("Noe gikk galt ved oppretting av søknad");
        return;
      }
      
      toast.success("Søknad opprettet");
      router.push(`/atlas-app/i-soknad?id=${data.applicationID}`);
    },
    onError: (error) => {
      setIsCreating(false);
      toast.error(`Error: ${error.message}`);
    }
  });
  
  // Navigation handler - now initiates application creation
  const handleCreateNewApplication = async () => {
    setIsCreating(true);
    
    // Use a default/temporary application type
    const temporaryType = "pending" as ApplicationType; 
    
    await createApplication.mutateAsync({
      applicationType: temporaryType,
      subTypeId: "pending", 
      submissionDate: new Date(),
      updatedDate: new Date(),
      status: "Pabegynt"
    });
  };
  
  // Delete handler with confirmation
  const handleDeleteApplication = (applicationID: number) => {
    if (confirm("Are you sure you want to delete this application? This cannot be undone.")) {
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

  // Status to badge style mapping
  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'Sendt':
        return 'bg-green-100 text-green-800';
      case 'Ferdig_behandlet':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };


  return (
    <div className="p-4">
      <h1 className="text-3xl pt-4 font-bold flex justify-center text-kartAI-blue mb-8">Mine Søknader</h1>
      <p className="text-xl md:mx-20 px-6 mb-4 flex justify-center">Her finner du en oversikt over alle byggesøknadene dine - både de du jobber med, og de du
          allerede har sendt inn. Du kan forstsette på en kladd, sjekke status, eller starte en ny søknad.
      </p>
      <div className="flex justify-end mb-4">
        <button 
          onClick={handleCreateNewApplication}
          disabled={isCreating}
          className={`flex items-center justify-center gap-2 px-4 py-2 md:mr-20 
            ${isCreating 
              ? 'bg-blue-400 cursor-not-allowed' 
              : 'bg-white border-kartAI-blue border-2 hover:bg-kartAI-blue hover:text-white'} 
            text-kartAI-blue font-medium rounded-md transition-colors`}
        >
          {isCreating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-1"></div>
              Creating...
            </>
          ) : (
            <>
              <PlusCircle size={16} />
              Lag en ny Byggesøknad
            </>
          )}
        </button>
      </div>

      {applications && applications.length > 0 ? (
        <div className="space-y-4 px-6 py-6 rounded-lg md:mx-20 bg-white">
          {applications.map((application) => (
            <div key={application.applicationID} className="border bg-white rounded-md p-4 shadow-sm hover:bg-gray-100">
              <div className="flex gap-x-2">
                <span className={`px-2 py-1 rounded text-sm ${getStatusBadgeStyle(application.status)}`}>
                  {application.status}
                </span>
                <h2 className="text-lg font-semibold">
                  SAK{application.applicationID} - {APPLICATION_TYPE_DISPLAY_NAMES[application.applicationType as ApplicationType]}
                </h2>
                
              </div>

              <div className="mt-2 text-sm">
                <p className="font-medium">Startet: {formatDate(application.submissionDate)}</p>
                <p className="mt-2">Søknad: {APPLICATION_TYPE_DISPLAY_NAMES[application.applicationType as ApplicationType]}</p>
              </div>
              
              <div className="mt-2 text-sm text-gray-500">
                <p>Sist endret: {formatDate(application.updatedDate)}</p>
              </div>
              
              <div className="mt-3 flex justify-between">
                <a 
                  href={`/atlas-app/i-soknad/${application.applicationID}/applicant-details`} 
                  className="text-sm p-2 rounded-lg text-white bg-kartAI-blue hover:bg-kartAI-lightblue transition-color duration-300"
                >
                  Se detaljer →
                </a>

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
                    <Trash2 size={16} />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-100 p-6 text-center rounded-md md:mx-20">
          <p className="text-gray-500">Du har ingen søknader enda.</p>
          <p className="mt-4">Trykk på <span className="font-medium">"Lag ny Byggesøknad"</span>  for å starte.</p>
        </div>
      )}
    </div>
  );
};

export default MyApplications;