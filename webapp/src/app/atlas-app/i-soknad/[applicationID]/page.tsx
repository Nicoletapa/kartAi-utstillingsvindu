"use client";

import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import ProgressBarStep from '~/components/ProgressBarStep';
import { FormProvider } from "~/context/FormContext";

export default function ApplicationDetailPage() {
  // Get the applicationID from the URL parameters
  const params = useParams();
  const applicationID = parseInt(params.applicationID as string, 10);
  
  // Fetch the application data using TRPC
  const { data: application, isLoading, error } = api.application.getApplication.useQuery({ 
    applicationID 
  }, {
    // Only fetch if we have a valid applicationID
    enabled: !isNaN(applicationID)
  });

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Application Not Found</h1>
        <div className="bg-red-100 p-4 rounded-md text-red-700">
          {error ? error.message : "Could not load the application. It may have been deleted or you don't have permission to view it."}
        </div>
        <div className="mt-4">
          <a href="/atlas-app/sidebar/soknader" className="text-blue-600 hover:underline">
            ← Back to Applications
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <a href="/atlas-app/sidebar/soknader" className="text-blue-600 hover:underline text-sm">
          ← Back to My Applications
        </a>
      </div>
      
      <h1 className="text-2xl font-bold mb-6">
        {application.applicationType.replace(/_/g, ' ')}
      </h1>
      
      {/* Pass the applicationID to the ProgressBarStep component */}
      <FormProvider>
        <ProgressBarStep applicationID={applicationID} />
      </FormProvider>
    </div>
  );
}