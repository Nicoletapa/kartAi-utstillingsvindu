/**
 * This file is used in Utstillingsvindu 2.0
 * 
 * @description
 * This component provides recently started/submitted applications (max 3), buttons to start a new
 * building application, and a button to go to "Mine Søknader" page. 
 * 
 * @features
 * - Displays a list of recent applications with details
 * - Allows users to expand/collapse application details
 *    - Users can choose to continue or delete the application
 * - Provides buttons to create a new application and view all applications
 * 
 * @props
 * - `app` (object): The application object containing details like ID, type, submission date, and status.
 * - `expandedAppId` (number|null): The ID of the currently expanded application.
 * - `onExpand` (function): Function to handle expanding/collapsing applications.
 * - `onDelete` (function): Function to handle deleting applications.
 * - `router` (object): The Next.js router object for navigation.
 * 
 * @note
 * - On the web page, this page displays the full-size chatbot (PlanChatAtlas.tsx). 
 * - The chatbot directly on the page min-oversikt/page.tsx
 * 
 * @usage
 * <MyOverview />
 */

"use client"

import React, { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { api } from "~/trpc/react";
import { APPLICATION_TYPE_DISPLAY_NAMES } from "~/utils/applicationTypes";
import type { ApplicationType } from "@prisma/client";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

type ApplicationCardProps = {
  app: {
    applicationID: number;
    applicationType: string;
    subTypeId: string | null;
    submissionDate: Date;
    status: string;
  };
  expandedAppId: number | null;
  onExpand: (id: number) => void;
  onDelete: (id: number) => void;
  router: ReturnType<typeof useRouter>;
};

const ApplicationCard: React.FC<ApplicationCardProps> = ({
  app,
  expandedAppId,
  onExpand,
  onDelete,
  router
}) => {
  const isExpanded = expandedAppId === app.applicationID;

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
    <div
      key={app.applicationID}
      onClick={() => onExpand(app.applicationID)}
      className='cursor-pointer hover:bg-gray-50 transition-colors border rounded-lg p-4 shadow-sm mb-2'
    >
      <div className='flex flex-col md:flex-row md:items-center justify-between space-y-2 md:space-y-0 md:space-x-4'>
        <p className='font-medium w-full md:w-[250px] truncate'>
          SAK{app.applicationID} - {APPLICATION_TYPE_DISPLAY_NAMES[app.applicationType as ApplicationType]}
        </p>
        <p className="w-full md:w-[200px] truncate">
          Type: {app.subTypeId ?? <span className="italic text-gray-400">Ingen underkategori</span>}
        </p>
        <p className='w-full md:w-[150px]'>
          Startet: {new Date(app.submissionDate).toLocaleDateString("no-NO")}
        </p>
        <p className={`whitespace-nowrap rounded px-2 py-1 w-full md:w-[130px] text-center ${getStatusBadgeStyle(app.status)}`}>
          {app.status}
        </p>
      </div>

      {isExpanded && (
        <div className='mt-6 flex flex-row gap-2 justify-star'>
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/atlas-app/i-soknad/${app.applicationID}/applicant-details`);
            }}
            className='bg-kartAI-blue text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-kartAI-lightblue transition'
          >
            Fortsett/endre søknad
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(app.applicationID);
            }}
            className='bg-red-500 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-red-600 transition'
          >
            Slett søknad
          </button>
        </div>
      )}
    </div>
  );
};

const ActionButtons: React.FC<{
  isCreating: boolean;
  onCreate: () => void;
  onViewAll: () => void;
}> = ({ isCreating, onCreate, onViewAll }) => (
  <div className="flex mt-4 gap-4 justify-start">
    <button
      onClick={onCreate}
      disabled={isCreating}
      className={`flex items-center justify-center gap-2 px-4 py-2 
        ${isCreating
          ? 'bg-blue-400 cursor-not-allowed'
          : 'bg-white border-kartAI-blue border-2 hover:bg-kartAI-blue hover:text-white'} 
        text-kartAI-blue font-medium rounded-md transition-colors`}
    >
      {isCreating ? (
        <>
          <Loader2 className="animate-spin text-gray-500" size={24} />
          Creating...
        </>
      ) : (
        <>Start en ny søknad</>
      )}
    </button>
    <button
      onClick={onViewAll}
      className="flex items-center justify-center gap-2 px-4 py-2 
        bg-white border-gray-300 border-2 hover:bg-gray-100 
        text-gray-700 font-medium rounded-md transition-colors"
    >
      Se alle søknader
    </button>
  </div>
);

const LoadingState: React.FC = () => (
  <div className="p-4">
    <div className="flex justify-center">
      <Loader2 className="animate-spin text-gray-500" size={24} />
      <p className='text-center'>Laster inn...</p>
    </div>
  </div>
);

const ErrorState: React.FC<{ error: { message: string } }> = ({ error }) => (
  <p className="text-center text-red-500">Noe gikk galt: {error.message}</p>
);

const MyOverview = () => {
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();
  const [expandedAppId, setExpandedAppId] = useState<number | null>(null);

  const { data: users } = api.user.getUserDetails.useQuery();
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
      router.push(`/atlas-app/i-soknad/${data.applicationID}/applicant-details`);
    },
    onError: (error) => {
      setIsCreating(false);
      toast.error(`Error: ${error.message}`);
    }
  });

  const deleteApplication = api.application.deleteApplication.useMutation({
    onSuccess: () => {
      toast.success("Søknaden ble slettet.");
      void refetch();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    }
  });

  const handleCreateNewApplication = async () => {
    setIsCreating(true);
    const temporaryType = "pending" as ApplicationType;
    await createApplication.mutateAsync({
      applicationType: temporaryType,
      subTypeId: "pending",
      submissionDate: new Date(),
      updatedDate: new Date(),
      status: "Pabegynt"
    });
  };

  const handleViewAllApplications = () => {
    router.push('/atlas-app/sidebar/soknader');
  };

  const handleDeleteApplication = (applicationID: number) => {
    if (confirm("Er du sikker på at du vil slette denne søknaden? Dette kan ikke angres.")) {
      deleteApplication.mutate({ applicationID });
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedAppId(prev => (prev === id ? null : id));
  };

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={{ message: error.message }} />;

  const recentApplications = allApplications?.slice(0, 3);

  return (
    <div className='p4'>
      <h1 className='text-3xl pt-4 font-bold flex justify-center text-kartAI-blue mb-8'>
        Hei {users?.name ?? 'bruker'}!
      </h1>

      <p className="text-xl md:mx-20 px-6 mb-4 flex justify-center">
        Her finner du en oversikt over nylige byggesøknader, chatbotten, og mer.
      </p>

      <div className='mt-8 md:mx-20'>
        <h2 className='text-2xl font-medium mb-4'>Søknader</h2>
        {recentApplications?.map((app) => (
          <ApplicationCard
            key={app.applicationID}
            app={app}
            expandedAppId={expandedAppId}
            onExpand={toggleExpand}
            onDelete={handleDeleteApplication}
            router={router}
          />
        ))}

        <ActionButtons
          isCreating={isCreating}
          onCreate={handleCreateNewApplication}
          onViewAll={handleViewAllApplications}
        />
      </div>
    </div>
  );
};

export default MyOverview;