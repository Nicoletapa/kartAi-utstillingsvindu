/**
 * This file is used in Utstillingsvindu 2.0
 */

import React from "react";
import { api } from "~/trpc/react";
import { useEffect, useState } from "react";
import { Tooltip, useTooltip } from "./ui/ui-components";
import { tooltipInfo } from "~/utils/tooltipInfo";
import {
  transformApplicationData,
  type TransformedApplicationData,
} from "~/utils/dispensasjon-config";

type ApplicationData = TransformedApplicationData;

const Dispensasjon = ({
  application,
  user,
}: {
  application: {
    applicationID: number;
  };
  user: {
    email: string;
    address: string;
    name: string;
    gnr: number;
    bnr: number;
  };
}) => {
  const [applicationData, setApplicationData] = useState<ApplicationData>({});

  const { data: appDataFromApi } = api.application.getApplication.useQuery(
    { applicationID: application?.applicationID },
    { enabled: !!application?.applicationID },
  );

  const tooltip = useTooltip();

  useEffect(() => {
    const transformedData = transformApplicationData(appDataFromApi);
    setApplicationData(transformedData);
  }, [appDataFromApi]);

  const header = [
    { value: "Kristiansand" },
    { value: "Byggesaksavdeling" },
    { value: "Rådhusgata 18" },
    { value: "4604, Kristiansand" },
    { value: "38 07 50 00" },
    { value: "post@kristiansand.kommune.no" },
    {
      label: "Saksnummer:",
      value: String(
        application?.applicationID ?? applicationData.saksnummer ?? "2024/001",
      ),
    },
    { label: "Dato:", value: new Date().toLocaleDateString("no-NO") },
  ];

  const infoFields = [
    { label: "Søker:", value: user?.name ?? "Ikke spesifisert" },
    { label: "Adresse:", value: user?.address ?? "Ikke spesifisert" },
    {
      label: "Eiendom:",
      value:
        applicationData.eiendomAdresse ?? user?.address ?? "Ikke spesifisert",
    },
    {
      label: "Gnr./Bnr:",
      value:
        applicationData.gbnr ??
        (user?.gnr && user?.bnr
          ? `${user.gnr}/${user.bnr}`
          : "Ikke spesifisert"),
    },
    {
      label: "Tiltakets art:",
      value: applicationData.tiltakType ?? "Ikke spesifisert",
    },
  ];

  const detaljerInfoFields = [
    { label: "Størrelse:", value: `${applicationData.storrelse ?? "0"} m²` },
    {
      label: "Materiale:",
      value: applicationData.materiale ?? "Ikke spesifisert",
    },
    { label: "Høyde:", value: `${applicationData.hoyde ?? "0"} meter` },
    {
      label: "Takvinkel:",
      value: `${applicationData.takvinkel ?? "0"} grader`,
    },
    {
      label: "Avstand til nabogrense:",
      value: `${applicationData.nabogrense ?? "0"} meter`,
    },
  ];

  const beskrivelse = [
    { value: applicationData.beskrivelse ?? "Ikke spesifisert" },
  ];

  const footer = [
    { value: "[Underskrift]" },
    { value: user?.name ?? "Ikke spesifisert" },
  ];

  return (
    <div>
      <div className="flex justify-center">
        <h1 className="text-3xl font-bold">Søknad om Dispensasjon</h1>
        <Tooltip
          id="SøknadOmDispensasjon"
          content={tooltipInfo.dispensasjon}
          isVisible={tooltip.isVisible("SøknadOmDispensasjon")}
          onMouseEnter={tooltip.handleMouseEnter}
          onMouseLeave={tooltip.handleMouseLeave}
        />
      </div>
      <div className="mt-6 w-full rounded-lg border-4 border-gray-400">
        <div className="px-3">
          <div className="mb-3 border-b-2 py-3">
            {header.map((field, index) => (
              <div
                key={index}
                className={`flex ${field.label === "Saksnummer:" ? "mt-6" : ""}`}
              >
                <p
                  className={`flex font-medium ${field.label === "Saksnummer:" || field.label === "Dato:" ? "mr-1" : ""}`}
                >
                  {field.label}
                </p>
                <span>{field.value}</span>
              </div>
            ))}
          </div>

          <div className="mb-3 border-b-2 py-3">
            <h1 className="font-medium">Dispensasjonssøknad for byggesøknad</h1>
            {infoFields.map((field, index) => (
              <div key={index} className="flex">
                <p className="mr-1 font-medium">{field.label}</p>
                <span>{field.value}</span>
              </div>
            ))}
          </div>

          <div>
            <h1 className="text-xl font-medium">
              Bygningsdetaljer (hvis aktuelt):
            </h1>
            {detaljerInfoFields.map((field, index) => (
              <ul key={index} className="ml-7 flex list-disc">
                <li className="mr-1 font-medium">{field.label}</li>
                <span>{field.value}</span>
              </ul>
            ))}
          </div>

          <div className="mt-6">
            <h1 className="text-xl font-medium">Beskrivelse av tiltaket:</h1>
            <div>
              {beskrivelse.map((field, index) => (
                <p key={index} className="flex">
                  <span>{field.value}</span>
                </p>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <h1 className="text-xl font-medium">
              Begrunnelse for dispensasjonssøknaden:
            </h1>
            <p>
              [En kort beskrivelse av hvorfor du søker dispensasjon fra
              gjeldende reguleringsplan, byggteknisk forskrift eller annen
              relevant lovgivning. Dette kan inneholde informasjon om hvordan
              tiltaket ikke vil medføre vesentlige negative konsekvenser for
              naboer, miljøet eller området for øvrig.]
            </p>
          </div>

          <div className="mb-3 mt-6 border-b-2 py-3">
            <p className="font-medium">Vedlegg:</p>
            <ul className="mb-4 ml-7 list-disc">
              <li>Situasjonskart</li>
              <li>Byggetegninger</li>
              <li>Nabovarsler (hvis aktuelt)</li>
              <li>Andre relevante dokumenter</li>
            </ul>
          </div>
          <h1 className="font-medium">Søkers underskrift:</h1>
          {footer.map((field, index) => (
            <div key={index} className="flex">
              <span>{field.value}</span>
            </div>
          ))}
          <div className="flex justify-center">
            <button className="my-3 w-96 rounded-lg border-2 border-kartAI-blue py-2 text-kartAI-blue duration-300 hover:bg-kartAI-blue hover:text-white">
              Send dispensasjonssøknad
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dispensasjon;
