"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";
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
  router,
}) => {
  const isExpanded = expandedAppId === app.applicationID;

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "Sendt":
        return "bg-green-100 text-green-800";
      case "Ferdig_behandlet":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  return (
    <div
      key={app.applicationID}
      onClick={() => onExpand(app.applicationID)}
      className="mb-2 cursor-pointer rounded-lg border p-4 shadow-sm transition-colors hover:bg-gray-50"
    >
      <div className="flex flex-col justify-between space-y-2 md:flex-row md:items-center md:space-x-4 md:space-y-0">
        <p className="w-full truncate font-medium md:w-[250px]">
          SAK{app.applicationID} -{" "}
          {
            APPLICATION_TYPE_DISPLAY_NAMES[
              app.applicationType as ApplicationType
            ]
          }
        </p>
        <p className="w-full truncate md:w-[200px]">
          Type:{" "}
          {app.subTypeId ?? (
            <span className="italic text-gray-400">Ingen underkategori</span>
          )}
        </p>
        <p className="w-full md:w-[150px]">
          Startet: {new Date(app.submissionDate).toLocaleDateString("no-NO")}
        </p>
        <p
          className={`w-full whitespace-nowrap rounded px-2 py-1 text-center md:w-[130px] ${getStatusBadgeStyle(app.status)}`}
        >
          {app.status}
        </p>
      </div>

      {isExpanded && (
        <div className="justify-star mt-6 flex flex-row gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(
                `/atlas-app/i-soknad/${app.applicationID}/applicant-details`,
              );
            }}
            className="rounded-md bg-kartAI-blue px-4 py-2 text-sm font-medium text-white transition hover:bg-kartAI-lightblue"
          >
            Fortsett/endre søknad
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(app.applicationID);
            }}
            className="rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600"
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
  <div className="mt-4 flex justify-start gap-4">
    <button
      onClick={onCreate}
      disabled={isCreating}
      className={`flex items-center justify-center gap-2 px-4 py-2 ${
        isCreating
          ? "cursor-not-allowed bg-blue-400"
          : "border-2 border-kartAI-blue bg-white hover:bg-kartAI-blue hover:text-white"
      } rounded-md font-medium text-kartAI-blue transition-colors`}
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
      className="flex items-center justify-center gap-2 rounded-md border-2 border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-100"
    >
      Se alle søknader
    </button>
  </div>
);

const LoadingState: React.FC = () => (
  <div className="p-4">
    <div className="flex justify-center">
      <Loader2 className="animate-spin text-gray-500" size={24} />
      <p className="text-center">Laster inn...</p>
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
      router.push(
        `/atlas-app/i-soknad/${data.applicationID}/applicant-details`,
      );
    },
    onError: (error) => {
      setIsCreating(false);
      toast.error(`Error: ${error.message}`);
    },
  });

  const deleteApplication = api.application.deleteApplication.useMutation({
    onSuccess: () => {
      toast.success("Søknaden ble slettet.");
      void refetch();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const handleCreateNewApplication = async () => {
    setIsCreating(true);
    const temporaryType = "pending" as ApplicationType;
    await createApplication.mutateAsync({
      applicationType: temporaryType,
      subTypeId: "pending",
      submissionDate: new Date(),
      updatedDate: new Date(),
      status: "Pabegynt",
    });
  };

  const handleViewAllApplications = () => {
    router.push("/atlas-app/sidebar/soknader");
  };

  const handleDeleteApplication = (applicationID: number) => {
    if (
      confirm(
        "Er du sikker på at du vil slette denne søknaden? Dette kan ikke angres.",
      )
    ) {
      deleteApplication.mutate({ applicationID });
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedAppId((prev) => (prev === id ? null : id));
  };

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={{ message: error.message }} />;

  const recentApplications = allApplications?.slice(0, 3);

  return (
    <div className="p4">
      <h1 className="mb-8 flex justify-center pt-4 text-3xl font-bold text-kartAI-blue">
        Hei {users?.name ?? "bruker"}!
      </h1>

      <p className="mb-4 flex justify-center px-6 text-xl md:mx-20">
        Her finner du en oversikt over nylige byggesøknader, chatbotten, og mer.
      </p>

      <div className="mt-8 md:mx-20">
        <h2 className="mb-4 text-2xl font-medium">Søknader</h2>
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
