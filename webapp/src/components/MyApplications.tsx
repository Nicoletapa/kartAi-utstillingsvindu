"use client"

import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import { ApplicationType } from "@prisma/client";
import { Trash2, PlusCircle, Info, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { APPLICATION_TYPE_DISPLAY_NAMES } from "~/utils/applicationTypes";
import { useState } from "react";

type ApplicationStatus = 'Sendt' | 'Ferdig_behandlet' | 'Pabegynt' | string;

const ApplicationModal = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" onClick={onClose}>
    <div 
      className="bg-white mx-80 p-6 rounded-lg shadow-lg w-full transform transition-all scale-95 opacity-0 animate-fadeIn"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-8">
        <h1 className="text-2xl font-medium">Informasjon om søknad</h1>
        <h2 className="mb-2 mt-2">Hva kan du gjøre her?</h2>
        <ul className="list-disc ml-8 mt-2 space-y-1">
          <li>Se status på søknader du har sendt inn</li>
          <li>Redigere søknader du jobber med (kladder)</li>
          <li>Laste ned ferdige søknader eller dokumenter</li>
          <li>Starte en ny søknad når du har et nytt tiltak ved å klikke på "Lag en ny Byggesøknad"</li>
        </ul>

        <div className="mt-8">
          <h1 className="text-xl font-medium mb-2">Statusforklaringer</h1>
          <div className="max-w-3xl">
            <div className="rounded-lg overflow-hidden border border-gray-500">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="text-left p-4 font-medium border-b border-gray-500">Status</th>
                    <th className="text-left p-4 font-medium border-b border-gray-500">Forklaring</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-blue-50 border-b border-gray-500">
                    <td className="p-4">Kladd</td>
                    <td className="p-4">Søknaden er påbegynt, men ikke sendt inn enda.</td>
                  </tr>
                  <tr className="bg-blue-50 border-b border-gray-500">
                    <td className="p-4">Innsendt</td>
                    <td className="p-4">Søknaden er sendt inn og venter på behandling.</td>
                  </tr>
                  <tr className="bg-blue-50 border-b border-gray-500">
                    <td className="p-4">Under behandling</td>
                    <td className="p-4">Søknaden er mottatt og vurderes av kommunen.</td>
                  </tr>
                  <tr className="bg-blue-50 border-b border-gray-500">
                    <td className="p-4">Godkjent</td>
                    <td className="p-4">Søknaden er behandlet og godkjent.</td>
                  </tr>
                  <tr className="bg-blue-50 border-b border-gray-500 last:border-b-0">
                    <td className="p-4">Avvist</td>
                    <td className="p-4">Søknaden ble avslått av kommunen.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <h1 className="mt-8 text-xl font-medium">
          Vær oppmerksom på at alle søknader lagres automatisk underveis.
          Du kan alltid gå tilbake og fortsette senere.
        </h1>
      </div>
      
      <button 
        className="absolute mt-4 px-4 py-2 right-3 bottom-3 bg-gray-400 text-white rounded hover:bg-gray-500 transition"
        onClick={onClose}
      >
        Lukk
      </button>
    </div>
  </div>
);

const ApplicationCard = ({
  application,
  onDelete,
  isDeleting,
}: {
  application: {
    applicationID: number;
    status: string;
    applicationType: ApplicationType;
    submissionDate: Date;
    updatedDate: Date;
  };
  onDelete: (id: number) => void;
  isDeleting: boolean;
}) => {
  const formatDate = (date: Date) => 
    new Date(date).toLocaleDateString('nb-NO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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

  return (
    <div className="border bg-white rounded-md p-4 shadow-sm hover:bg-gray-100">
      <div className="flex gap-x-2">
        <span className={`px-2 py-1 rounded text-sm ${getStatusBadgeStyle(application.status)}`}>
          {application.status}
        </span>
        <h2 className="text-lg font-semibold">
          SAK{application.applicationID} - {APPLICATION_TYPE_DISPLAY_NAMES[application.applicationType]}
        </h2>
      </div>

      <div className="mt-2 text-sm">
        <p className="font-medium">Startet: {formatDate(application.submissionDate)}</p>
        <p className="mt-2">Søknad: {APPLICATION_TYPE_DISPLAY_NAMES[application.applicationType]}</p>
      </div>
      
      <div className="mt-2 text-sm text-gray-500">
        <p>Sist endret: {formatDate(application.updatedDate)}</p>
      </div>
      
      <div className="mt-3 flex justify-between">
        <a 
          href={`/atlas-app/i-soknad/${application.applicationID}/applicant-details`} 
          className="text-sm p-2 px-4 rounded-lg text-white bg-kartAI-blue hover:bg-kartAI-lightblue transition-color duration-300"
        >
          Se detaljer →
        </a>

        <button
          onClick={() => onDelete(application.applicationID)}
          disabled={isDeleting}
          className={`text-red-500 hover:text-red-700 p-1 rounded transition-colors ${
            isDeleting ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          title="Delete application"
        >
          {isDeleting ? (
            <div className="w-4 h-4 border-t-2 border-red-500 rounded-full animate-spin"></div>
          ) : (
            <Trash2 size={16} />
          )}
        </button>
      </div>
    </div>
  );
};

const CreateApplicationButton = ({
  isLoading,
  onClick,
}: {
  isLoading: boolean;
  onClick: () => void;
}) => (
  <button 
    onClick={onClick}
    disabled={isLoading}
    className={`flex items-center justify-center gap-2 px-4 py-2 md:mr-20 
      ${isLoading 
        ? 'bg-blue-400 cursor-not-allowed' 
        : 'bg-white border-kartAI-blue border-2 hover:bg-kartAI-blue hover:text-white'} 
      text-kartAI-blue font-medium rounded-md transition-colors`}
  >
    {isLoading ? (
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
);

const MyApplications = () => {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  
  const { 
    data: applications, 
    isLoading, 
    error, 
    refetch 
  } = api.application.getAllApplications.useQuery();
  
  const deleteApplication = api.application.deleteApplication.useMutation({
    onSuccess: () => {
      toast.success("Søknaden ble slettet.");
      refetch();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    }
  });
  
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
  
  const handleCreateNewApplication = async () => {
    setIsCreating(true);
    await createApplication.mutateAsync({
      applicationType: "pending",
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

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="flex justify-center">
          <Loader2 className="animate-spin text-gray-500" size={24} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-100 p-4 rounded-md text-red-700">
          Error loading applications: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-3xl pt-4 font-bold flex justify-center text-kartAI-blue mb-8">
        Mine Søknader
        <Info 
          size={18} 
          className="ml-2 hover:cursor-pointer text-kartAI-blue" 
          onClick={() => setOpenModal(true)} 
        />
      </h1>
      
      {openModal && <ApplicationModal onClose={() => setOpenModal(false)} />}
      
      <p className="text-xl md:mx-20 px-6 mb-4 flex justify-center">
        Her finner du en oversikt over alle byggesøknadene dine - både de du jobber med, og de du
        allerede har sendt inn. Du kan forstsette på en kladd, sjekke status, eller starte en ny søknad.
      </p>
      
      <div className="flex justify-end mb-4">
        <CreateApplicationButton 
          isLoading={isCreating} 
          onClick={handleCreateNewApplication} 
        />
      </div>

      {applications && applications.length > 0 ? (
        <div className="space-y-4 px-6 py-6 rounded-lg md:mx-20 bg-white">
          {applications.map((application) => (
            <ApplicationCard
              key={application.applicationID}
              application={application}
              onDelete={handleDeleteApplication}
              isDeleting={
                deleteApplication.isPending && 
                deleteApplication.variables?.applicationID === application.applicationID
              }
            />
          ))}
        </div>
      ) : (
        <div className="bg-gray-100 p-6 text-center rounded-md md:mx-20">
          <p className="text-gray-500">Du har ingen søknader enda.</p>
          <p className="mt-4">Trykk på <span className="font-medium">"Lag ny Byggesøknad"</span> for å starte.</p>
        </div>
      )}
    </div>
  );
};

export default MyApplications;