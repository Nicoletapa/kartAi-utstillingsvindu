import React, { useEffect, useState } from 'react'
import { api } from "~/trpc/react";

interface ApplicationData {
    kommune?: string;
    adresse?: string;
    postInfo?: string;
    storrelse?: number;
    materiale?: string;
    hoyde?: number;
    takvinkel?: number;
    nabogrense?: number;
    beskrivelse?: string;
  }

const Soknaden = ({
    application,
    user,
    userDocuments,
  }: {
    application: {
      applicationID: number;
      applicationType: string;
    },
    user: {
      email: string;
      address: string;
      name: string;
      gnr: number;
      bnr: number;
      postalCode: string;
      postalArea: string;
    },
    userDocuments: {
      documentID: number;
      fileName: string;
      documentType: string;
      applicationID: number;
    }[];
  }) => {
        const { data: users } = api.user.getUserDetails.useQuery();
        const { data: appData } = api.application.getApplication.useQuery({ 
            applicationID: application?.applicationID
        });
        const { data: documents } = api.userDocuments.getUserDocuments.useQuery({
            applicationID: application?.applicationID
        });
        const [applicationData, setApplicationData] = useState<ApplicationData>({});

  useEffect(() => {
      if (appData) {
        setApplicationData({
          kommune: appData.application_fields.find(field => field.fieldName === "kommune")?.fieldValue,
          adresse: appData.application_fields.find(field => field.fieldName === "adresse")?.fieldValue,
          postInfo: appData.application_fields.find(field => field.fieldName === "postInfo")?.fieldValue,
          storrelse: Number(appData.application_fields.find(field => field.fieldName === "fields.distances.size")?.fieldValue) || undefined,
          materiale: appData.application_fields.find(field => field.fieldName === "materiale")?.fieldValue,
          hoyde: Number(appData.application_fields.find(field => field.fieldName === "fields.distances.mønehøyde")?.fieldValue) || undefined,
          takvinkel: Number(appData.application_fields.find(field => field.fieldName === "takvinkel")?.fieldValue) || undefined,
          nabogrense: Number(appData.application_fields.find(field => field.fieldName === "fields.distances.neighbor_boundary")?.fieldValue) || undefined,
          beskrivelse: appData.application_fields.find(field => field.fieldName === "description")?.fieldValue,

        });
      }
    }, [appData]);

    const byggInfoFields = [
        { label: "Tiltakstype:", value: application?.applicationType },
        { label: "Adresse:", value: applicationData.adresse ?? "Rådhusgata 18" },
        { label: "Kommune:", value: applicationData.kommune ?? "Kristiansand" },
        { label: "Tiltakshaver:", value: `${users?.name}, ${users?.address}, ${users?.postalCode} ${users?.postalArea}` },
        { label: "Ansvarlig søker:", value: users?.name }
    ]
    
    const detaljerInfoFields = [
        { label: "Størrelse:", value: `${applicationData.storrelse ?? "0"} m²` },
        { label: "Materiale:", value: applicationData.materiale ?? "Ikke spesifisert" },
        { label: "Høyde:", value: `${applicationData.hoyde ?? "0"} meter` },
        { label: "Takvinkel:", value: `${applicationData.takvinkel ?? "0"} grader` },
        { label: "Avstand til nabogrense:", value: `${applicationData.nabogrense ?? "0"} meter` }
    ]

    const vedlagtFields = [
        { value : "Situasjonskart" },
        { value : "Plantegning" },
        { value : "Fasadetegning" },
        { value : "Snittegning" },
    ]

    const vedleggFields = [
        { value: documents?.map((doc) => (
            <li key={doc.documentID} className='list-disc ml-7'>{doc.fileName}</li>
        )) ?? "Ingen vedlegg" },
    ]
    
  return (
    <div className="w-full border-4 rounded-lg border-gray-400 mt-6">
        <div className="px-5">
           <div className="border-b-2 py-3 mb-3 mt-2">
                <h1 className="font-medium mb-2">BYGGESØKNAD</h1>
                {byggInfoFields.map((field, index) => (
                <div key={index} className="flex">
                    <p className="font-medium mr-1">{field.label}</p>
                    <span>{field.value}</span>
                </div>
                ))}
            </div> 

            <div>
                <h1 className="font-medium text-xl mb-1">Beskrivelse av tiltaket</h1>
                <p className='mb-4'>{applicationData.beskrivelse}</p>
                <p className='font-medium'>Bygningdetaljer:</p>
                {detaljerInfoFields.map((field, index) => (
                <ul key={index} className="flex list-disc ml-7">
                    <li className="font-medium mr-1">{field.label}</li>
                    <span>{field.value}</span>
                </ul>
                ))}

                <p className='mt-4 mb-4'>[Begrunnelse]</p>
            </div>

            <div>
                <h1 className='font-medium text-xl mb-1'>Situasjonskart og tegninger</h1>
                <p className='font-medium'>Vedlagt følger:</p>
                <ul className='list-disc mb-4'>
                    {vedlagtFields.map((field, index) => (
                        <li key={index} className='list-disc ml-7'>{field.value}</li>
                    ))}
                </ul>
            </div>

            <div>
                <h1 className='font-medium text-xl mb-1'>Nabovarsling</h1>
                
                <p className='mb-4'>[Beskrivelse av nabovarsel prosess]</p>
            </div>

            <div>
                <h1 className='font-medium text-xl mb-1'>Dispensasjoner</h1>
                <p className='mb-4'>[Beskrivelse om søker har søkt om dispensasjon eller ikke]</p>
            </div>

            <div>
                <h1 className='font-medium text-xl mb-1'>Ansvarsrett</h1>
                <p className='mb-4'>Tiltakshaver {users?.name} står selv ansvarlig for tiltaket, da det er innenfor
                    unntaker for ansvarsrett iht. plan- og bygningsloven.
                </p>
            </div>

            <div>
                <h1 className='font-medium text-xl m1-7'>Vedlegg</h1>
                <ul className='mb-7'>
                    {vedleggFields.map((field, index) => (
                        <span key={index}>{field.value}</span>
                    ))}
                </ul>
            </div>
        </div>
    </div>
  )
}

export default Soknaden
