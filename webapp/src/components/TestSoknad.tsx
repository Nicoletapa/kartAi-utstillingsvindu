"use client";

import { ApplicationTemplate } from "~/components/ApplicationTemplate";
import { ApplicationType } from "@prisma/client";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { useEffect, useState } from "react";
import { api } from "~/trpc/react";

type TestSoknadProps = {
  applicationID?: number;
  isNew?: boolean;
};

export default function TestSoknad({ applicationID, isNew = false }: TestSoknadProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<ApplicationType | null>(null);
  
  // Get type from search params if it exists
  const typeFromParams = searchParams.get("type") as ApplicationType | null;
  
  // Create application mutation
  const createApplication = api.application.createApplication.useMutation({
    onSuccess: (data) => {
      // Navigate to the application page with the created ID
      router.push(`/atlas-app/i-soknad/${data.applicationID}?type=${data.applicationType}`);
    },
    onError: (error) => {
      toast.error(`Failed to create application: ${error.message}`);
    }
  });

  // Handle application creation after type selection
  const handleCreateApplication = (applicationType: ApplicationType) => {
    createApplication.mutate({
      applicationType,
      submissionDate: new Date(),
      updatedDate: new Date(),
      status: "Pabegynt"
    });
  };
  
  useEffect(() => {
    
    if (!isNew && !applicationID) {
      toast.error("Invalid application ID");
      router.push("/atlas-app");
      return;
    }

    if (typeFromParams) {
      setSelectedType(typeFromParams);
    }
    
    setIsLoading(false);
  }, [applicationID, typeFromParams, router, isNew]);
  
  if (isLoading) {
    return <div className="p-6 text-center">Loading application...</div>;
  }
  
  return (
    <ApplicationTemplate 
      applicationType={selectedType || undefined}
      applicationID={applicationID}
      isNewApplication={isNew}
      onTypeSelect={handleCreateApplication}
    />
  );
}