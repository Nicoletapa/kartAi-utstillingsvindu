"use client"
import React, { useState } from 'react';
import { api } from "~/trpc/react";
import { toast } from "react-hot-toast";
import { Button } from '../../../components/ui/button';
import { ArrowRight, ArrowLeft, CheckCircle, Info } from 'lucide-react'
import { useRouter, useSearchParams } from "next/navigation";
import { FormProvider } from "~/context/FormContext";

export default function ApplicationStartPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Use non-null assertion (!) if you are certain 'id' will exist or handle the null case explicitly
  const applicationIDParam = searchParams.get('id');
  const applicationID = applicationIDParam ? parseInt(applicationIDParam, 10) : undefined;
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredBox, setHoveredBox] = useState<string | null>(null);

  // Fetch application details if we have an ID
  const { data: application, isLoading: isLoadingApplication, isError } = api.application.getApplication.useQuery(
    // Ensure applicationID is not undefined before querying
    { applicationID: applicationID! }, // Use ! assertion if applicationID is guaranteed
    { enabled: !!applicationID } // Only run query if applicationID is truthy
  );

  // Handle mouse events for tooltips
  const handleMouseEnter = (boxId: string) => {
    setHoveredBox(boxId);
  };

  const handleMouseLeave = () => {
    setHoveredBox(null);
  };

  // Handle next button click
  const handleContinue = () => {
    setIsLoading(true);
    if (applicationID) {
      // Navigate to the "applicant-details" page with the applicationID in the URL
      router.push(`/atlas-app/i-soknad/${applicationID}/applicant-details`);
    } else {
      toast.error("Ingen søknads-ID funnet");
      setIsLoading(false);
    }
  };

  // Handle back button click
  const handleBack = () => {
    router.push('/atlas-app'); // Go back to home
  };

  // Handle loading and error states more explicitly
  if (!applicationID) {
     return (
       <div className="flex justify-center items-center h-full">
         <p className="text-red-500">Ingen søknads-ID funnet i URL.</p>
         {/* Optionally add a button to go back or retry */}
       </div>
     );
  }

  if (isLoadingApplication) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3">Laster søknadsdata...</span>
      </div>
    );
  }

   if (isError || !application) {
     return (
       <div className="flex justify-center items-center h-full">
         <p className="text-red-500">Kunne ikke laste søknadsdata.</p>
         {/* Optionally add a button to go back or retry */}
       </div>
     );
   }

  // If loading is complete and no error, application should exist
  return (
    <FormProvider>
      <div className="flex flex-col items-center justify-center h-full mt-16">
        <h1 className="text-3xl font-bold justify-center flex">Din søknad er opprettet</h1>

        <div className="border-2 border-gray-400 rounded-lg mt-4 p-4 lg:w-[950px]" data-cy="main-container">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-2/6" data-cy="left-column">
              <h1 className='font-medium mb-4'>Søknadsinformasjon</h1>
              <div className='flex-1 space-y-2'>
                <div className="flex">
                  <p className="font-medium mr-1">Søknads-ID:</p>
                  {/* applicationID is guaranteed non-null here */}
                  <span>{applicationID}</span>
                </div>
                <div className="flex">
                  <p className="font-medium mr-1">Status:</p>
                  {/* application is guaranteed non-null here */}
                  <span>{application.status}</span>
                </div>
                <div className="flex">
                  <p className="font-medium mr-1">Opprettet:</p>
                  {/* application is guaranteed non-null here */}
                  <span>{new Date(application.submissionDate).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="mt-6 bg-green-50 p-3 rounded border-l-4 border-green-500 flex items-start">
                <CheckCircle className="h-6 w-6 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-green-800 text-sm">
                  Din søknad er nå opprettet og klar for videre utfylling. Du kan fortsette med å definere hva søknaden gjelder.
                </p>
              </div>
            </div>

            <div className="w-full md:w-4/6 md:border-l-2 md:border-gray-400 md:pl-8" data-cy="right-column">
              <h1 className='font-medium inline-flex'>
                Neste steg
                <div className="relative flex">
                  <Info
                    size={14}
                    className="ml-1 hover:cursor-pointer"
                    onMouseEnter={() => handleMouseEnter('neste-steg')}
                    onMouseLeave={handleMouseLeave}
                  />
                  {hoveredBox === 'neste-steg' && (
                    <div
                      className="absolute top-0 left-6 bg-white shadow-lg border rounded-lg p-3 w-64 text-sm z-10"
                      onMouseEnter={() => handleMouseEnter('neste-steg')}
                      onMouseLeave={handleMouseLeave}
                    >
                      I neste steg må du velge hvilken type søknad du ønsker å opprette.
                    </div>
                  )}
                </div>
              </h1>

              <div className='flex flex-col space-y-4 mt-2'>
                <div className="p-4 bg-gray-50 rounded-md border">
                  <h2 className="font-medium mb-2 text-gray-800">1. Velg søknadstype</h2>
                  <p className="text-sm text-gray-600">
                    I neste steg vil du velge hva søknaden skal gjelde. Du kan velge mellom
                    å bygge nytt, bygge til, rive, eller endre bruk av eksisterende bygg.
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-md border">
                  <h2 className="font-medium mb-2 text-gray-800">2. Fyll inn søknadsinformasjon</h2>
                  <p className="text-sm text-gray-600">
                    Etter at du har valgt søknadstype, vil du bli bedt om å fylle inn
                    nødvendig informasjon om søknaden, som eiendomsopplysninger og personopplysninger.
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-md border">
                  <h2 className="font-medium mb-2 text-gray-800">3. Last opp dokumenter</h2>
                  <p className="text-sm text-gray-600">
                    Du vil få muligheten til å laste opp relevante dokumenter og
                    tegninger som er nødvendige for å behandle søknaden din.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 w-full flex justify-center gap-4">
          <Button
            onClick={handleBack}
            className="border-2 bg-white text-gray-500 border-gray-500 hover:bg-gray-500 hover:text-white w-44"
          >
            <ArrowLeft className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-1" />
            <span className="relative inline-block">Tilbake</span>
          </Button>

          <Button
            onClick={handleContinue}
            disabled={isLoading || !applicationID} // Keep disabled check based on original applicationID from params
            className={`border-2 bg-white w-44 ${
              !isLoading && applicationID
                ? "text-kartAI-blue border-kartAI-blue hover:text-white hover:bg-kartAI-blue"
                : "text-gray-400 border-gray-300 cursor-not-allowed"
            }`}
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current mr-2"></div>
            ) : null}
            <span className="relative inline-block">
              Neste
            </span>
            <ArrowRight size={18} className="ml-2" />
          </Button>
        </div>
      </div>
    </FormProvider>
  );
}