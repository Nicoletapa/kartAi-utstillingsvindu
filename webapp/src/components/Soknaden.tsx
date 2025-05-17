/**
 * This file is used in Utstillingsvindu 2.0
 * 
 * @description
 * This component is part of the building application process.
 * It displays a template for the application form.
 * Data that the user has filled out in the application form is 
 * displayed here throught the database, where the inputs are stored.
 * 
 * @features
 * - Data is gathered from the database using TRPC, and displayed in the appropriate fields.
 *      - api.user.getUserDetails
 *      - api.application.getApplication
 *      - api.userDocuments.getUserDocuments
 * - The "Send søknad" button is not functional yet.
 * 
 * @props
 * - `application` (object): The application data fetched from the database.
 * - `user` (object): The user data fetched from the database.
 * - `userDocuments` (object): The user documents data fetched from the database.
 * 
 * @note
 * - This component is designed to be used in a client-side context.
 * - The data is fetched using TRPC, and the component is wrapped in a React functional component.
 * 
 * @usage
 * const soknadenProps = {
    application: {
      applicationID: applicationData.applicationID,
      applicationType: String(applicationData.applicationType ?? 'Ikke spesifisert'),
    },
    user: {
      email: userData.email ?? '',
      address: userData.address ?? '',
      name: userData.name ?? '',
      gnr: userData.gnr ?? 0,
      bnr: userData.bnr ?? 0,
      postalCode: userData.postalCode ?? '',
      postalArea: userData.postalArea ?? '',
    },
    userDocuments: userDocumentsData
      .filter(doc => doc.applicationID !== null)
      .map(doc => ({
        documentID: doc.documentID,
        fileName: doc.fileName ?? 'Ukjent filnavn',
        documentType: doc.document ?? 'Ukjent type',
        applicationID: doc.applicationID!,
      }))
  };

 * <Soknaden {...soknadenProps}
 */

import React, { useEffect, useState } from 'react'
import { api } from "~/trpc/react";
import { Info } from 'lucide-react';

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
    const [openModal, setOpenModal] = useState<boolean>(false);

    const handleOpenModal = () => setOpenModal(true);
    const handleCloseModal = () => setOpenModal(false);

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
        { value: "Situasjonskart" },
        { value: "Plantegning" },
        { value: "Fasadetegning" },
        { value: "Snittegning" },
    ]

    const vedleggFields = [
        {
            value: documents?.map((doc) => (
                <li key={doc.documentID} className='list-disc ml-7'>{doc.fileName}</li>
            )) ?? "Ingen vedlegg"
        },
    ]

    return (
        <div>
            <h1 className="text-3xl font-bold justify-center flex">Søknaden
                <Info size={18} className="ml-2 hover:cursor-pointer" onClick={handleOpenModal} />
            </h1>
            {openModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" onClick={handleCloseModal}>
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full transform transition-all scale-95 opacity-0 animate-fadeIn"
                        onClick={(e) => e.stopPropagation()}>
                        <div className="mb-8">
                            <h1 className="text-xl font-medium">Om Søknaden</h1>
                            <p className="text-sm mt-2">
                                Byggesøknaden har blitt generert og fylt ut basert på informasjonen du har oppgitt.
                                <br />
                                <br />
                                Du kan redigere informasjonen i søknaden ved å gå tilbake til de relevante seksjonen i søknaden din.
                                Dobbelsjekk at all informasjon og detaljer er korrekte før du sender inn søknaden.
                            </p>
                        </div>

                        <button className="absolute mt-4 px-4 py-2 right-3 bottom-3 bg-gray-400 text-white rounded hover:bg-gray-500 transition"
                            onClick={handleCloseModal}>
                            Lukk
                        </button>
                    </div>
                </div>
            )}
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

        </div>
    )
}

export default Soknaden
