"use client";
import React from 'react'
import { ArrowRight, Loader2 } from 'lucide-react'
import { ApplicationType } from "@prisma/client";
import { useState } from "react";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import toast from 'react-hot-toast';
import { Button } from './ui/button';

type TemplateProps = {
  isNewApplication?: boolean;
  onTypeSelect?: (applicationID: number) => void;
};

export function SendAppNow({ isNewApplication, onTypeSelect }: TemplateProps) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  const createApplication = api.application.createApplication.useMutation({
    onSuccess: (data) => {
      setIsCreating(false);
      
      if (!data?.applicationID) {
        toast.error("Noe gikk galt ved oppretting av søknad");
        return;
      }
      
      toast.success("Søknad opprettet");
      
      if (onTypeSelect) {
        
        onTypeSelect(data.applicationID);
      } else {
        
        router.push(`/atlas-app/i-soknad/${data.applicationID}/applicant-details`);
      }
    },
    onError: (error) => {
      setIsCreating(false);
      toast.error(`Error: ${error.message}`);
    }
  });

  // Simplified application creation without type
  const handleCreateApplication = async () => {
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

  if (isCreating) {
    return (
      <div className="container mx-auto py-6 px-4 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center">
        <Loader2 className="animate-spin text-gray-500" size={24} />
        <p className="text-lg">Oppretter søknad...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col justify-center h-full max-w-2xl mx-auto px-6 border-kartAI-blue mb-4'>
      <h1 className='font-medium text-2xl text-gray-700 text-center'>Vet du allerede at du må søke?</h1>

      <p className='mt-2 text-center text-lg'>
        Dersom du allerede vet at tiltaket krever en byggesøknad eller dispensasjon, 
        kan du starte søknadsprosessen med en gang. Klikk på knappen under for å sende inn en søknad.
      </p>

      <div className="mt-5 w-full flex justify-center">
        <Button 
          onClick={handleCreateApplication}
          disabled={isCreating}
          className="text-kartAI-blue px-4 py-3 group flex items-center gap-2 border-2 rounded-lg border-kartAI-blue bg-white transition-all hover:bg-kartAI-blue hover:text-white" 
        >
          <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
          <span className="relative inline-block">
            Send inn en søknad
          </span>
        </Button>
      </div>
    </div>
  );
}