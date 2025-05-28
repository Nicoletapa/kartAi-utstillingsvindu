/**
 * This file is used in Utstillingsvindu 2.0
 */

import React, { useState } from "react";
import { api } from "~/trpc/react";
import { Info } from "lucide-react";
import { InfoModal } from "./InfoModal";
import { tooltipInfo } from "~/utils/tooltipInfo";

interface NabovarselProps {
  applicationID: number;
}

const Nabovarsel: React.FC<NabovarselProps> = () => {
  const [openModal, setOpenModal] = useState<boolean>(false);

  const { data: users } = api.user.getUserDetails.useQuery();
  const handleOpenModal = () => setOpenModal(true);

  const infoFields = [
    { label: "Til:", value: "[Navn på nabo]" },
    { label: "Adresse:", value: "[Naboens adresse]" },
    { label: "Fra:", value: users?.name },
    { label: "Adresse:", value: users?.address },
    { label: "Dato:", value: new Date().toLocaleDateString("no-NO") },
  ];

  const contactInfoFields = [
    { label: "E-post:", value: users?.email },
    { label: "Telefon:", value: users?.phone },
  ];

  const footer = [{ value: users?.name }];

  return (
    <div>
      <h1 className="flex justify-center text-3xl font-bold">
        Nabovarsel
        <Info
          size={18}
          className="ml-2 hover:cursor-pointer"
          onClick={handleOpenModal}
        />
      </h1>
      <InfoModal
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
        title="Sending av Nabovarsel"
        descriptionTitle="Nabovarselen vil sendes til berørende naboer via e-post. I nabovarselen vil følgende bli beskrevet:"
        items={tooltipInfo.sendingAvNabovarsel}
      />

      <div className="mt-6 h-full w-full rounded-lg border-4 border-gray-400">
        <div className="px-3">
          <div className="mb-3 border-b-2 py-3">
            {infoFields.map((field, index) => (
              <div
                key={index}
                className={`flex ${field.label === "Fra:" ? "mt-6" : ""}`}
              >
                <p className="mr-1 font-medium">{field.label}</p>
                <span>{field.value}</span>
              </div>
            ))}
          </div>

          <div className="mb-44">
            <h1 className="font-medium">
              Varsel om byggesøknad - Oppføring av garasje
            </h1>
            <p>
              I henhold til plan-og bygningsloven § 21-3 varsles du herved om at
              det vil bli sendt inn en byggesak til ______ kommune for oppføring
              av en frittstående garasje på min eiendom, {users?.address}.
            </p>
          </div>

          <div>
            <p>
              Tiltaket er i tråd med gjeldende reguleringsplan og krever ingen
              dispensasjon.
            </p>
            <h1 className="mt-1 font-medium">
              Dine muligheter til å komme med merknader:
            </h1>
            <p>
              Dersom du har innspill eller merknader til dette tiltaket, kan du
              sende disse skriftlig til meg innen 14 dager fra datoen for dette
              varselet. Dersom du ikke git tilbakemelding innen fristen, anses
              det som at du ikke har merknader til tiltaket.
            </p>
            <p className="mt-10">
              Vedlagt følger situasjonskart som viser plasseringen av garasjen.
            </p>
          </div>

          <div className="mt-6">
            <h1 className="font-medium">Kontaktinformasjon:</h1>
            {contactInfoFields.map((field, index) => (
              <div key={index} className="flex">
                <p className="mr-1 font-medium">{field.label}</p>
                <span>{field.value}</span>
              </div>
            ))}

            <div className="mb-10 mt-4">
              <p className="font-medium">Vennlig hilsen,</p>
              {footer.map((field, index) => (
                <div key={index} className="flex">
                  <span>{field.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-center">
            <button className="my-3 w-96 rounded-lg border-2 border-kartAI-blue py-2 text-kartAI-blue duration-300 hover:bg-kartAI-blue hover:text-white">
              Send nabovarsel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Nabovarsel;
