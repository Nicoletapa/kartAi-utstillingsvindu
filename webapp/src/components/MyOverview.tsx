"use client"

import React, { useState } from 'react'
import { api } from "~/trpc/react";
import { APPLICATION_TYPE_DISPLAY_NAMES } from "~/utils/applicationTypes";
import { ApplicationType } from "@prisma/client";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
const MapChatIntegrationWithNoSSR = dynamic(
  () => import("~/components/MapChatIntegration"),
  { ssr: false } 
);

const MyOverview = () => {
      const [isCreating, setIsCreating] = useState(false);
      const router = useRouter();
      const [expandedAppId, setExpandedAppId] = useState<number | null>(null);

    const {
        data: users,
    } = api.user.getUserDetails.useQuery();

    const { 
        data: allApplications,
         isLoading,
         error, 
         refetch,
    } = api.application.getAllApplications.useQuery();

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

      const deleteApplication = api.application.deleteApplication.useMutation({
        onSuccess: () => {
          toast.success("Søknaden ble slettet.");
          refetch();
        },
        onError: (error) => {
          toast.error(`Error: ${error.message}`);
        }
      });

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

        const handleDeleteApplication = (applicationID: number) => {
            if (confirm("Er du sikker på at du vil slette denne søknaden? Dette kan ikke angres.")) {
              deleteApplication.mutate({ applicationID });
            }
          };

        const recentApplications = allApplications?.slice(0, 3);

        const toggleExpand = (id: number) => {
            setExpandedAppId(prev => (prev === id ? null : id));
        }

        if (isLoading) return <p className="text-center">Laster inn...</p>;
        if (error) return <p className="text-center text-red-500">Noe gikk galt: {error.message}</p>;
    
  return (
    <div className='p4'>
      <h1 className='text-3xl pt-4 font-bold flex justify-center text-kartAI-blue mb-8'>Hei {users?.name ?? 'bruker'}!</h1>

      <p className="text-xl md:mx-20 px-6 mb-4 flex justify-center">Her finner du en oversikt over nylige byggesøknader, chatbotten, og mer.
      </p>

          <div className='mt-8 md:mx-20'>
              <h2 className='text-2xl font-medium mb-4'>Søknader</h2>
              {recentApplications?.map((app) => {
                const isExpanded = expandedAppId === app.applicationID;
                return (
                    <div
    key={app.applicationID}
    onClick={() => toggleExpand(app.applicationID)}
    className='cursor-pointer hover:bg-gray-50 transition-colors border rounded-lg p-4 shadow-sm mb-2'
>
    <div className='flex flex-col md:flex-row md:items-center justify-between space-y-2 md:space-y-0 md:space-x-4'>
        <p className='font-medium w-full md:w-[250px] truncate'>
            SAK{app.applicationID} - {APPLICATION_TYPE_DISPLAY_NAMES[app.applicationType as ApplicationType]}
        </p>
        <p className="w-full md:w-[200px] truncate">Type: {app.subTypeId || <span className="italic text-gray-400">Ingen underkategori</span>}</p>
        <p className='w-full md:w-[150px]'>Startet: {new Date(app.submissionDate).toLocaleDateString("no-NO")}</p>
        <p className={`whitespace-nowrap rounded px-2 py-1 w-full md:w-[130px] text-center ${getStatusBadgeStyle(app.status)}`}>
            {app.status}
        </p>
    </div>
    
    {isExpanded && (
        <div className='mt-6 flex flex-row gap-2 justify-start duration-300'>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/atlas-app/i-soknad?id=${app.applicationID}`);
                }}
                className='bg-kartAI-blue text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-kartAI-lightblue transition'
            >
                Fortsett/endre søknad
            </button>
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteApplication(app.applicationID)
                }}
                className='bg-red-500 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-red-600 transition'
            >
                Slett søknad
            </button>
        </div>
    )}
</div>

                  
                )
              })}

              <button
                  onClick={handleCreateNewApplication}
                  disabled={isCreating}
                  className={`flex mt-4 items-center justify-center gap-2 px-4 py-2 md:mr-20 
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
                          Start en ny søknad
                      </>
                  )}
              </button>
          </div>

        <div className='mt-8'>
            <h2 className='flex justify-center text-xl mb-4'>Få veiledning fra chatbotten vår!</h2>
            <MapChatIntegrationWithNoSSR />
        </div>
    </div>
  )
}

export default MyOverview
