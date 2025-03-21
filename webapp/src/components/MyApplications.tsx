"use client"

import { useState } from "react";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import { ApplicationType } from "@prisma/client";
import { Trash2 } from "lucide-react";
import {toast} from "react-hot-toast";
import { APPLICATION_TYPE_DISPLAY_NAMES } from "~/utils/applicationTypes";



const applicationTypeDisplayNames = APPLICATION_TYPE_DISPLAY_NAMES;

const MyApplications = () => {
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const router = useRouter();
    

  const { data: applications, isLoading, error, refetch} = api.application.getAllApplications.useQuery();

  
  const handleCreateNewApplication = () => {
    router.push('/atlas-app/SoknadTest/new');
  };

  const deleteApplication = api.application.deleteApplication.useMutation({
    onSuccess: () => {
        toast.success("Application deleted successfully");
        refetch();
    },
    onError: (error )=> {
        toast.error(`Error : ${error.message}`);
        setDeletingId(null);

    },
    onSettled: () => {
        setDeletingId(null);
    }
  });
  const handleDeleteApplication = (applicationID: number ) => {
    if(confirm ("Are you sure you want to delete this application? this cannot be undone.")){
        setDeletingId(applicationID);
        deleteApplication.mutate({applicationID});
    }
  }

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

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">My Applications</h1>
  
        <button 
          onClick={handleCreateNewApplication}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Create New Application
        </button>
      </div>

      {applications && applications.length > 0 ? (
        <div className="space-y-4">
          {applications.map((application) => (
            <div key={application.applicationID} className="border rounded-md p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between">
                <h2 className="text-lg font-semibold">
                  {applicationTypeDisplayNames[application.applicationType as ApplicationType]}
                </h2>
                <span className={`px-2 py-1 rounded text-sm ${
                  application.status === 'Sendt' ? 'bg-green-100 text-green-800' : 
                  application.status === 'Ferdig' ? 'bg-blue-100 text-blue-800' : 
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {application.status}
                </span>
              </div>
              
              <div className="mt-2 text-sm text-gray-500">
                <p>Submitted: {new Date(application.submissionDate).toLocaleDateString()}</p>
                <p>Last updated: {new Date(application.updatedDate).toLocaleDateString()}</p>
              </div>
              
              <div className="mt-3">
                <a 
                  href={`/atlas-app/i-soknad/${application.applicationID}`} 
                  className="text-blue-600 hover:underline text-sm"
                >
                  View details →
                </a>

                <button
                onClick={() => handleDeleteApplication(application.applicationID)}
                disabled={deletingId === application.applicationID}
                className={`text-red-500 hover:text-red-700 p-1 rounded transition-colors ${
                  deletingId === application.applicationID ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                title="Delete application"
              >
                {deletingId === application.applicationID ? (
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
          <p className="text-gray-500">You don't have any applications yet.</p>
          <p className="mt-4">Click "Create New Application" to get started.</p>
        </div>
      )}
    </div>
  );
};

export default MyApplications;