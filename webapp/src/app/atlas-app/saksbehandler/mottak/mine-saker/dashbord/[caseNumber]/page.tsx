"use client";

import { useParams } from "next/navigation";
import { getCase, type CaseData } from "~/types/cases";
import Checklist from "~/components/Checklist";
import Summary from "~/components/Summary";
import EmbeddedFrame from "~/components/EmbeddedFrame";
import CaseDocumentsComponent from "~/components/CaseDocuments";
import ResultAI from "~/components/ResultAI";
import React from "react";
import type { Detection } from "~/types/detection";
import { transformDetectionToChecklist } from "~/utils/helpers";
import FeedbackSender from "~/components/FeedbackSender";
import AtlasSidebar from "~/components/AtlasSidebar";

// Define MarkedCheckpoint interface
interface MarkedCheckpoint {
  check_point_name: string;
  status: "Correct" | "Uncertain" | "Incorrect";
  reason: string;
}
// Assuming you have these interfaces defined

export interface SubItem {
  id: string;
  description: string;
  isComplete: boolean;
}

export interface ChecklistItemData {
  id: string;
  fileName: string;
  points: number;
  subItems: SubItem[];
}

// Define SummaryResponse interface
interface SummaryResponse {
  summary: string[];
  marked_checklist: MarkedCheckpoint[];
}

// Unique ID generator
const generateUniqueId = () => Math.random().toString(36).substr(2, 9);

// Function to transform MarkedCheckpoint to ChecklistItemData
const transformMarkedChecklistToChecklistItemData = (
  markedChecklist: MarkedCheckpoint[],
): ChecklistItemData[] => {
  return markedChecklist.map((checkpoint) => ({
    id: generateUniqueId(),
    fileName: checkpoint.check_point_name,
    points: 1,
    subItems: [
      {
        id: generateUniqueId(),
        description: checkpoint.reason,
        isComplete: checkpoint.status === "Correct",
      },
    ],
  }));
};

const fetchDetections = (): Detection[] => {
  const detections: Detection[] = [
    {
      file_name: "Plantegning.pdf",
      drawing_type: ["plantegning"],
      room_names: "Mangler rombenevnelse",
    },
    {
      file_name: "Snitt.pdf",
      drawing_type: ["snitt"],
      scale: "Mangler målestokk",
    },
    {
      file_name: "Fasade.pdf",
      drawing_type: ["fasade"],
      cardinal_direction: "Mangler himmelretning",
      scale: "Mangler målestokk",
    },
  ];

  return detections;
};

export default function CaseDashboard() {
  const { caseNumber } = useParams();
  const detections = fetchDetections();
  const checklist = transformDetectionToChecklist(detections);

  const ApplicationData: CaseData | undefined = getCase(100239);

  /** Handle date */
  const formatDate = (date: Date | undefined): string => {
    // If date is undefined, return a fallback value
    if (!date) {
      return "No date provided";
    }
    return date.toLocaleDateString("no-NO"); // Format date to 'DD.MM.YYYY'
  };

  // Mock data for SummaryResponse
  const summaryResponse: SummaryResponse = {
    summary: [
      // Existing aiSummary data
      "Søkeren søker om tillatelse til å utvide sin eksisterende terrasse med 20 kvadratmeter. Den nye terrassen vil gå fra 15 kvm til totalt 35 kvm.",
      "Huset er verneverdig og ligger i et område med høy bevaringsverdi.",
      "Terrassen vil ha en høyde på 1,2 meter fra bakken.",
      "Den skal plasseres på eiendommens sørside, som vender mot en privat hage.",
      "Det planlegges også integrering av en trapp for bedre tilgang til hagen.",
    ],
    marked_checklist: [
      {
        check_point_name: "Sjekk av arealutnyttelse",
        status: "Correct",
        reason: "Arealutnyttelsen er innenfor tillatte grenser.",
      },
      {
        check_point_name: "Kontroll av nabovarsel",
        status: "Incorrect",
        reason: "Nabovarsel mangler signatur fra naboer.",
      },
      {
        check_point_name: "Vurdering av høydebegrensning",
        status: "Uncertain",
        reason: "Høyden på terrassen er ikke spesifisert klart.",
      },
    ],
  };

  // Transform marked_checklist and combine with existing checklist
  const markedChecklistData = transformMarkedChecklistToChecklistItemData(
    summaryResponse.marked_checklist,
  );
  const combinedChecklist = [...checklist, ...markedChecklistData];

  /* Dummy data for case documents component */

  const BASE_URL =
    "http://localhost:3001/saksbehandler/mottak/mine-saker/dashbord/" +
    +String(caseNumber) +
    "/";
  const documents = [
    { name: "Plantegning.pdf", url: BASE_URL + "Plantegning.pdf" },
    { name: "Snitt_øst.jpg", url: BASE_URL + "Snitt_øst.jpg" },
    { name: "Snitt_vest.jpg", url: BASE_URL + "Snitt_vest.jpg" },
    { name: "Snitt_nord.jpg", url: BASE_URL + "Snitt_nord.jpg" },
    {
      name: "Bevis_på_nabovarseler.pdf",
      url: BASE_URL + "Bevis_på_nabovarseler.pdf",
    },
    { name: "Søknadsdokument.pdf", url: BASE_URL + "Søknadsdokument.pdf" },
  ];

  return (
    <AtlasSidebar>
      <h1 data-cy="title" className="mx-4 my-5 text-2xl md:mx-10 md:text-3xl">
        <strong>Oversikt over søknadsanalyse:</strong>
      </h1>

      {caseNumber ? (
        <div className="flex flex-col space-y-6 px-6">
          <div className="mx-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:mx-10">
            <p>
              <strong>Saksnummer:</strong> {ApplicationData?.caseNumber}
            </p>
            <p>
              <strong>Adresse:</strong> {ApplicationData?.address}
            </p>
            <p>
              <strong>Eiendom:</strong> GNR: {ApplicationData?.farmUnit}, BNR:{" "}
              {ApplicationData?.propertyUnit}
            </p>
            <p>
              <strong>Innsendingsdato:</strong>{" "}
              {formatDate(ApplicationData?.receiveDate)}
            </p>
            <p>
              <strong>Frist:</strong> {ApplicationData?.deadline}
            </p>
          </div>

          <div className="mt-6 flex w-full flex-col lg:flex-row">
            <div className="flex w-full flex-col gap-6 p-4 md:p-10 lg:w-1/3">
              <div data-cy="sjekkliste">
                <Checklist checklist={combinedChecklist} />
              </div>
              <div data-cy="summary">
                <Summary summaryData={summaryResponse.summary} />
              </div>
            </div>

            <div className="h-[400px] w-full p-4 lg:h-auto lg:w-2/3 lg:p-10">
              <EmbeddedFrame
                data-cy="plansituasjon"
                src="https://www.arealplaner.no/vennesla4223/arealplaner/53?knr=4223&gnr=5&bnr=547&teigid=214401611"
                title="plansituasjon"
                width="100%"
                height="100%"
                className="w-full rounded-md border border-gray-300"
              />
            </div>
          </div>

          <div className="flex w-full flex-col gap-6 p-4 lg:flex-row lg:p-10">
            <div className="w-full lg:w-1/2">
              <CaseDocumentsComponent documents={documents} />
            </div>

            <div className="w-full lg:w-1/2">
              <FeedbackSender checklist={combinedChecklist} />
            </div>
          </div>

          <div className="p-4 lg:p-10">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div data-cy="archiveGPT-component">
                <ResultAI
                  title={"ArkivGPT"}
                  status={"success"}
                  feedback={"Arkivdata funnet"}
                  redirect={BASE_URL + "arkivgpt"}
                />
              </div>
              <div>
                <ResultAI
                  title={"CAD-AiD"}
                  status={"failure"}
                  feedback={"KRITISKE MANGLER"}
                  redirect={BASE_URL + "cadaid"}
                />
              </div>
              <div>
                <ResultAI
                  title={"3D-tiltaksvisning"}
                  status={"success"}
                  feedback={"Se visualisering"}
                  redirect={"http://localhost:3001/"}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <p className="p-4">No case number provided</p>
      )}
    </AtlasSidebar>
  );
}
