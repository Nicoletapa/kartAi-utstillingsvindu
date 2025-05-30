/**
 * This file is used in Utstillingsvindu 2.0
 *
 * @description
 * This component provides an overview of all the user's applications. They can create a new application,
 * or edit an already made one. The user can also delete applications, the status is also shown.
 *
 * @features
 * - Displays a list of applications with their status
 * - Allows the user to create a new application
 * - Allows the user to delete an application
 * - Uses TRPC for data fetching and mutation
 * - Applications are saved in the database
 *
 * @props
 * - `onClose` (function): Callback function to close the modal.
 *
 * @note
 * - This component is designed to be used in a client-side context.
 *
 * @usage
 * <MyApplications />
 */

"use client";

import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import type { ApplicationType } from "@prisma/client";
import { Trash2, PlusCircle, Info, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { APPLICATION_TYPE_DISPLAY_NAMES } from "~/utils/applicationTypes";
import { useState } from "react";

const ApplicationModal = ({ onClose }: { onClose: () => void }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center overflow-y-scroll bg-black bg-opacity-50 pt-2"
    onClick={onClose}
  >
    <div
      className="mx-80 w-full scale-95 transform animate-fadeIn rounded-lg bg-white p-6 opacity-0 shadow-lg transition-all"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-8">
        <h1 className="text-2xl font-medium">Informasjon om søknad</h1>
        <h2 className="mb-2 mt-2">Hva kan du gjøre her?</h2>
        <ul className="ml-8 mt-2 list-disc space-y-1">
          <li>Se status på søknader du har sendt inn</li>
          <li>Redigere søknader du jobber med (kladder)</li>
          <li>Laste ned ferdige søknader eller dokumenter</li>
          <li>
            Starte en ny søknad når du har et nytt tiltak ved å klikke på
            &quot;Lag en ny Byggesøknad&quot;
          </li>
        </ul>

        <div className="mt-8">
          <h1 className="mb-2 text-xl font-medium">Statusforklaringer</h1>
          <div className="max-w-3xl">
            <div className="overflow-hidden rounded-lg border border-gray-500">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="border-b border-gray-500 p-4 text-left font-medium">
                      Status
                    </th>
                    <th className="border-b border-gray-500 p-4 text-left font-medium">
                      Forklaring
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-500 bg-blue-50">
                    <td className="p-4">Kladd</td>
                    <td className="p-4">
                      Søknaden er påbegynt, men ikke sendt inn enda.
                    </td>
                  </tr>
                  <tr className="border-b border-gray-500 bg-blue-50">
                    <td className="p-4">Innsendt</td>
                    <td className="p-4">
                      Søknaden er sendt inn og venter på behandling.
                    </td>
                  </tr>
                  <tr className="border-b border-gray-500 bg-blue-50">
                    <td className="p-4">Under behandling</td>
                    <td className="p-4">
                      Søknaden er mottatt og vurderes av kommunen.
                    </td>
                  </tr>
                  <tr className="border-b border-gray-500 bg-blue-50">
                    <td className="p-4">Godkjent</td>
                    <td className="p-4">Søknaden er behandlet og godkjent.</td>
                  </tr>
                  <tr className="border-b border-gray-500 bg-blue-50 last:border-b-0">
                    <td className="p-4">Avvist</td>
                    <td className="p-4">Søknaden ble avslått av kommunen.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <h1 className="mt-8 text-xl font-medium">
          Vær oppmerksom på at alle søknader lagres automatisk underveis. Du kan
          alltid gå tilbake og fortsette senere.
        </h1>
      </div>

      <button
        className="absolute bottom-3 right-3 mt-4 rounded bg-gray-400 px-4 py-2 text-white transition hover:bg-gray-500"
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
    new Date(date).toLocaleDateString("nb-NO", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

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
    <div className="rounded-md border bg-white p-4 shadow-sm hover:bg-gray-100">
      <div className="flex gap-x-2">
        <span
          className={`rounded px-2 py-1 text-sm ${getStatusBadgeStyle(application.status)}`}
        >
          {application.status}
        </span>
        <h2 className="text-lg font-semibold">
          SAK{application.applicationID} -{" "}
          {APPLICATION_TYPE_DISPLAY_NAMES[application.applicationType]}
        </h2>
      </div>

      <div className="mt-2 text-sm">
        <p className="font-medium">
          Startet: {formatDate(application.submissionDate)}
        </p>
        <p className="mt-2">
          Søknad: {APPLICATION_TYPE_DISPLAY_NAMES[application.applicationType]}
        </p>
      </div>

      <div className="mt-2 text-sm text-gray-500">
        <p>Sist endret: {formatDate(application.updatedDate)}</p>
      </div>

      <div className="mt-3 flex justify-between">
        <a
          href={`/atlas-app/i-soknad/${application.applicationID}/applicant-details`}
          className="transition-color rounded-lg bg-kartAI-blue p-2 px-4 text-sm text-white duration-300 hover:bg-kartAI-lightblue"
        >
          Se detaljer →
        </a>

        <button
          onClick={() => onDelete(application.applicationID)}
          disabled={isDeleting}
          className={`rounded p-1 text-red-500 transition-colors hover:text-red-700 ${
            isDeleting ? "cursor-not-allowed opacity-50" : ""
          }`}
          title="Delete application"
        >
          {isDeleting ? (
            <div className="h-4 w-4 animate-spin rounded-full border-t-2 border-red-500"></div>
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
    className={`flex items-center justify-center gap-2 px-4 py-2 md:mr-20 ${
      isLoading
        ? "cursor-not-allowed bg-blue-400"
        : "border-2 border-kartAI-blue bg-white hover:bg-kartAI-blue hover:text-white"
    } rounded-md font-medium text-kartAI-blue transition-colors`}
  >
    {isLoading ? (
      <>
        <div className="mr-1 h-4 w-4 animate-spin rounded-full border-b-2 border-t-2 border-white"></div>
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
    refetch,
  } = api.application.getAllApplications.useQuery();

  const deleteApplication = api.application.deleteApplication.useMutation({
    onSuccess: () => {
      toast.success("Søknaden ble slettet.");
      void refetch();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

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

  const handleCreateNewApplication = async () => {
    setIsCreating(true);
    await createApplication.mutateAsync({
      applicationType: "pending",
      subTypeId: "pending",
      submissionDate: new Date(),
      updatedDate: new Date(),
      status: "Pabegynt",
    });
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
        <div className="rounded-md bg-red-100 p-4 text-red-700">
          Error loading applications: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="mb-8 flex justify-center pt-4 text-3xl font-bold text-kartAI-blue">
        Mine Søknader
        <Info
          size={18}
          className="ml-2 text-kartAI-blue hover:cursor-pointer"
          onClick={() => setOpenModal(true)}
        />
      </h1>

      {openModal && <ApplicationModal onClose={() => setOpenModal(false)} />}

      <p className="mb-4 flex justify-center px-6 text-xl md:mx-20">
        Her finner du en oversikt over alle byggesøknadene dine - både de du
        jobber med, og de du allerede har sendt inn. Du kan forstsette på en
        kladd, sjekke status, eller starte en ny søknad.
      </p>

      <div className="mb-4 flex justify-end">
        <CreateApplicationButton
          isLoading={isCreating}
          onClick={handleCreateNewApplication}
        />
      </div>

      {applications && applications.length > 0 ? (
        <div className="space-y-4 rounded-lg bg-white px-6 py-6 md:mx-20">
          {applications.map((application) => (
            <ApplicationCard
              key={application.applicationID}
              application={application}
              onDelete={handleDeleteApplication}
              isDeleting={
                deleteApplication.isPending &&
                deleteApplication.variables?.applicationID ===
                  application.applicationID
              }
            />
          ))}
        </div>
      ) : (
        <div className="rounded-md bg-gray-100 p-6 text-center md:mx-20">
          <p className="text-gray-500">Du har ingen søknader enda.</p>
          <p className="mt-4">
            Trykk på{" "}
            <span className="font-medium">&quot;Lag ny Byggesøknad&quot;</span>{" "}
            for å starte.
          </p>
        </div>
      )}
    </div>
  );
};

export default MyApplications;
