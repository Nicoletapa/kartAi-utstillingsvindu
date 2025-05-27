/**
 * This file is used in Utstillingsvindu 2.0
 * 
 * @description
 * This component is part of the building application process and is used to create a dispensasjonssøknad (dispensation application).
 * It includes sections for the header, applicant information, building details, and a signature section.
 * 
 * @features
 * - Available information is gathered from the database using TRPC
 *      - api.application.getApplication
 *      - api.user.getUserDetails
 * 
 * @props
 * - `application` (object): The application object containing the applicationID.
 * - `user` (object): The user object containing user details such as email, address, name, gnr, and bnr.
 * 
 * @note
 * - The "Send dispensasjonssøknad" button is not functional yet.
 * 
 * @usage
 * const dispensasjonProps = {
        application: {
            applicationID: applicationData.applicationID,
        },
        user: {
            email: userData.email ?? '', 
            address: userData.address ?? '',
            name: userData.name ?? '',
            gnr: userData.gnr ?? 0, 
            bnr: userData.bnr ?? 0,
        }
    }; 
 * <Dispensasjon {...dispensasjonProps} />
 */

import React from 'react'
import { api } from "~/trpc/react";
import { useEffect, useState } from 'react';
import { Info } from 'lucide-react';

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
    user
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
    const [openModal, setOpenModal] = useState<boolean>(false);


    const { data: appData } = api.application.getApplication.useQuery(
        { applicationID: application?.applicationID },
        { enabled: true }
    );


    const handleOpenModal = () => setOpenModal(true);
    const handleCloseModal = () => setOpenModal(false);

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
        { value: "Kristiansand" },
        { value: "Byggesaksavdeling" },
        { value: "Rådhusgata 18" },
        { value: "4604, Kristiansand" },
        { value: "38 07 50 00" },
        { value: "post@kristiansand.kommune.no" },
        { label: "Saksnummer:", value: application?.applicationID || "2024/001" },
        { label: "Dato:", value: new Date().toLocaleDateString('no-NO') },
    ]

    const infoFields = [
        { label: "Søker:", value: user?.name ?? "Ikke spesifisert" },
        { label: "Adresse:", value: user?.address ?? "Ikke spesifisert" },
        { label: "Eiendom:", value: applicationData.eiendomAdresse ?? "Ikke spesifisert" },
        { label: "Gnr./Bnr:", value: user?.gnr ?? "Ikke spesifisert" },
        { label: "Tiltakets art:", value: applicationData.tiltakType ?? "Ikke spesifisert" },
    ]

    const detaljerInfoFields = [
        { label: "Størrelse:", value: `${applicationData.storrelse ?? "0"} m²` },
        { label: "Materiale:", value: applicationData.materiale ?? "Ikke spesifisert" },
        { label: "Høyde:", value: `${applicationData.hoyde ?? "0"} meter` },
        { label: "Takvinkel:", value: `${applicationData.takvinkel ?? "0"} grader` },
        { label: "Avstand til nabogrense:", value: `${applicationData.nabogrense ?? "0"} meter` }
    ]

    const beskrivelse = [
        { value: applicationData.beskrivelse ?? "Ikke spesifisert" }
    ]

    const footer = [
        { value: "[Underskrift]" },
        { value: user?.name ?? "Ikke spesifisert" }

    ]

    return (
        <div>
            <h1 className="text-3xl font-bold justify-center flex">Søknad om Dispensasjon
                <Info size={18} className="ml-2 hover:cursor-pointer" onClick={handleOpenModal} />
            </h1>
            {openModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" onClick={handleCloseModal}>
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full transform transition-all scale-95 opacity-0 animate-fadeIn"
                        onClick={(e) => e.stopPropagation()}>
                        <div className="mb-8">
                            <h1 className="text-xl font-medium">Dispensasjonssøknaden</h1>
                            <p className="text-sm mt-2">
                                Informasjonen til dispensasjonssøknaden har blitt hentet fra all informasjonen som du har fylt inn om saken din.
                                <br />
                                <br />
                                Du kan redigere informasjonen i søknaden ved å gå tilbake til de relevante seksjonen i søknaden din.
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
                        <div>{beskrivelse.map((field, index) => (
                            <p key={index} className="flex">
                                <span>{field.value}</span>
                            </p>
                        ))}</div>
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
        </div>

    )
}

export default Dispensasjon
