"use client"

import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import type { ApplicationType } from "@prisma/client";
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
      toast.success("Application deleted successfully");
      void refetch();
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
    const temporaryType: ApplicationType = "pending";
    
    try {
      await createApplication.mutateAsync({
        applicationType: temporaryType,
        subTypeId: "pending", 
        submissionDate: new Date(),
        updatedDate: new Date(),
        status: "Pabegynt"
      });
    } catch (err) {
      setIsCreating(false);
    }
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
        <h1 className="text-2xl font-bold mb-4">My Applications</h1>
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
        <h1 className="text-2xl font-bold mb-4">My Applications</h1>
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

  // Main UI
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">My Applications</h1>
  
        <button 
          onClick={handleCreateNewApplication}
          disabled={isCreating}
          className={`flex items-center justify-center gap-2 px-4 py-2 
            ${isCreating 
              ? 'bg-blue-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'} 
            text-white rounded-md transition-colors`}
        >
          {isCreating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-1"></div>
              Creating...
            </>
          ) : (
            <>
              <PlusCircle size={16} />
              Create New Application
            </>
          )}
        </button>
      </div>

      {applications && applications.length > 0 ? (
        <div className="space-y-4">
          {applications.map((application) => (
            <div key={application.applicationID} className="border rounded-md p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between">
                <h2 className="text-lg font-semibold">
                  {APPLICATION_TYPE_DISPLAY_NAMES[application.applicationType]}
                </h2>
                <span className={`px-2 py-1 rounded text-sm ${getStatusBadgeStyle(application.status)}`}>
                  {application.status}
                </span>
              </div>
              
              <div className="mt-2 text-sm text-gray-500">
                <p>Submitted: {formatDate(application.submissionDate)}</p>
                <p>Last updated: {formatDate(application.updatedDate)}</p>
              </div>
              
              <div className="mt-3 flex justify-between">
                <a 
                  href={`/atlas-app/i-soknad/${application.applicationID}/applicant-details`} 
                  className="text-blue-600 hover:underline text-sm"
                >
                  View details →
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
        <div className="bg-gray-50 p-6 text-center rounded-md">
          <p className="text-gray-500">You don&apos;t have any applications yet.</p>
          <p className="mt-4">Click &quot;Create New Application&quot; to get started.</p>
        </div>
      )}
    </div>
  );
};

export default MyApplications;