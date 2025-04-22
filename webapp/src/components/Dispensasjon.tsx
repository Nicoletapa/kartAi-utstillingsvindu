import React from 'react'
import { api } from "~/trpc/react";
import { useEffect, useState } from 'react';

interface ApplicationData {
  kommune?: string;
  avdeling?: string;
  adresse?: string;
  postInfo?: string;
  telefon?: string;
  epost?: string;
  saksnummer?: string;
  soker?: string;
  sokerAdresse?: string;
  eiendomAdresse?: string;
  gbnr?: string;
  tiltakType?: string;
  storrelse?: number;
  materiale?: string;
  hoyde?: number;
  takvinkel?: number;
  nabogrense?: number;
  beskrivelse?: string;
}

const Dispensasjon = ({
      application,
      user,
    }: {
      application: {
        applicationID: number;
      },
      user: {
        email: string;
        address: string;
        name: string;
        gnr: number;
        bnr: number;
      }
    }
) => {
  const [applicationData, setApplicationData] = useState<ApplicationData>({});
  
  const { data: appData } = api.application.getApplication.useQuery(
    { applicationID: application.applicationID },
    { enabled: true } 
  );

  const { data: users } = api.user.getUserDetails.useQuery();

  
  useEffect(() => {
      if (appData) {
        setApplicationData({
          kommune: appData.application_fields.find(field => field.fieldName === "kommune")?.fieldValue,
          avdeling: appData.application_fields.find(field => field.fieldName === "avdeling")?.fieldValue,
          adresse: appData.application_fields.find(field => field.fieldName === "adresse")?.fieldValue,
          postInfo: appData.application_fields.find(field => field.fieldName === "postInfo")?.fieldValue,
          telefon: appData.application_fields.find(field => field.fieldName === "telefon")?.fieldValue,
          epost: appData.application_fields.find(field => field.fieldName === "epost")?.fieldValue,
          saksnummer: appData.application_fields.find(field => field.fieldName === "saksnummer")?.fieldValue,
          soker: appData.application_fields.find(field => field.fieldName === "soker")?.fieldValue,
          sokerAdresse: appData.application_fields.find(field => field.fieldName === "sokerAdresse")?.fieldValue,
          eiendomAdresse: appData.application_fields.find(field => field.fieldName === "eiendomAdresse")?.fieldValue,
          gbnr: appData.application_fields.find(field => field.fieldName === "gbnr")?.fieldValue,
          tiltakType: appData.applicationType,
          storrelse: Number(appData.application_fields.find(field => field.fieldName === "fields.distances.size")?.fieldValue) || undefined,
          materiale: appData.application_fields.find(field => field.fieldName === "materiale")?.fieldValue,
          hoyde: Number(appData.application_fields.find(field => field.fieldName === "fields.distances.mønehøyde")?.fieldValue) || undefined,
          takvinkel: Number(appData.application_fields.find(field => field.fieldName === "takvinkel")?.fieldValue) || undefined,
          nabogrense: Number(appData.application_fields.find(field => field.fieldName === "fields.distances.neighbor_boundary")?.fieldValue) || undefined,
          beskrivelse: appData.application_fields.find(field => field.fieldName === "description")?.fieldValue,

        });
      }
    }, [appData]);

  const header = [
    { value: applicationData.kommune || "Kristiansand"},
    { value: applicationData.avdeling || "Byggesaksavdeling"},
    { value: applicationData.adresse || "Rådhusgata 18"},
    { value: applicationData.postInfo || "4604, Kristiansand"},
    { value: applicationData.telefon || "38 07 50 00"},
    { value: applicationData.epost || "post@kristiansand.kommune.no"},
    { label: "Saksnummer:", value: application.applicationID || "2024/001" },
    { label: "Dato:", value: new Date().toLocaleDateString('no-NO') },
  ]

  const infoFields = [
    { label: "Søker:", value: users?.name || "Ikke spesifisert" },
    { label: "Adresse:", value: users?.address || "Ikke spesifisert" },
    { label: "Eiendom:", value: applicationData.eiendomAdresse || "Ikke spesifisert" },
    { label: "Gnr./Bnr:", value: users?.gnr || "Ikke spesifisert" },
    { label: "Tiltakets art:", value: applicationData.tiltakType || "Ikke spesifisert" },
  ]

  const detaljerInfoFields = [
    { label: "Størrelse:", value: `${applicationData.storrelse || "0"} m²` },
    { label: "Materiale:", value: applicationData.materiale || "Ikke spesifisert" },
    { label: "Høyde:", value: `${applicationData.hoyde || "0"} meter` },
    { label: "Takvinkel:", value: `${applicationData.takvinkel || "0"} grader` },
    { label: "Avstand til nabogrense:", value: `${applicationData.nabogrense || "0"} meter` }
  ]

  const beskrivelse = [
    { value: applicationData.beskrivelse || "Ikke spesifisert"}
  ]

  const footer = [
    { value: "[Underskrift]"},
    { value: users?.name || "Ikke spesifisert"}
 
 ]

  return (
    <div className="w-full border-4 rounded-lg border-gray-400 mt-6">
      <div className="px-3">
        <div className="border-b-2 py-3 mb-3">
            {header.map((field, index) => (
            <div key={index} className={`flex ${field.label === "Saksnummer:" ? "mt-6" : ""}`}>
                <p className={`flex font-medium ${field.label === "Saksnummer:" || field.label === "Dato:" ? "mr-1" : ""}`}>{field.label}</p>
                <span>{field.value}</span>
            </div>
        ))}
        </div>
        
        <div className="border-b-2 py-3 mb-3">
            <h1 className="font-medium">Dispensasjonssøknad for byggesøknad</h1>
            {infoFields.map((field, index) => (
                <div key={index} className="flex">
                    <p className="font-medium mr-1">{field.label}</p>
                    <span>{field.value}</span>
                </div>
            ))}
        </div>

        <div>
            <h1 className='font-medium text-xl'>Bygningsdetaljer (hvis aktuelt):</h1>
            {detaljerInfoFields.map((field, index) => (
                <ul key={index} className="flex list-disc ml-7">
                    <li className="font-medium mr-1">{field.label}</li>
                    <span>{field.value}</span>
                </ul>
                ))}
        </div>

        <div className='mt-6'>
            <h1 className='font-medium text-xl'>Beskrivelse av tiltaket:</h1>
            <p>{beskrivelse.map((field, index) => (
                <div key={index} className="flex">
                    <span>{field.value}</span>
                </div>
                ))}</p>
        </div>

        <div className='mt-6'>
            <h1 className='font-medium text-xl'>Begrunnelse for dispensasjonssøknaden:</h1>
            <p>[En kort beskrivelse av hvorfor du søker dispensasjon fra gjeldende reguleringsplan,
                byggteknisk forskrift eller annen relevant lovgivning. Dette kan inneholde informasjon om hvordan
                tiltaket ikke vil medføre vesentlige negative konsekvenser for naboer, miljøet eller området for øvrig.]</p>
        </div>

        <div className='mt-6 border-b-2 py-3 mb-3'>
            <p className='font-medium'>Vedlegg:</p>
                <ul className='list-disc ml-7 mb-4'>
                    <li>Situasjonskart</li>
                    <li>Byggetegninger</li>
                    <li>Nabovarsler (hvis aktuelt)</li>
                    <li>Andre relevante dokumenter</li>
                </ul>
        </div>
        <h1 className='font-medium'>Søkers underskrift:</h1>
        {footer.map((field, index) => (
            <div key={index} className='flex'>
                <span>{field.value}</span>
            </div>
        ))}
        <div className="flex justify-center">
            <button className="w-96 my-3 py-2 border-2 border-kartAI-blue rounded-lg text-kartAI-blue hover:bg-kartAI-blue hover:text-white duration-300">
                Send dispensasjonssøknad
            </button>
        </div>     
      </div>
    </div>
  )
}

export default Dispensasjon
