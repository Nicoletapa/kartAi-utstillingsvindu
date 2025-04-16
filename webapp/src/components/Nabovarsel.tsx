import React from 'react'
import { api } from "~/trpc/react";

const Nabovarsel = () => {
    const { data: users } = api.user.getUserDetails.useQuery();

    const infoFields = [
    { label: "Til:", value: "[Navn på nabo]" },
    { label: "Adresse:", value: "[Naboens adresse]" },
    { label: "Fra:", value: users?.name },
    { label: "Adresse:", value: users?.address },
    { label: "Dato:", value: new Date().toLocaleDateString('no-NO') }
]

const contactInfoFields = [
    { label: "E-post:", value: users?.email },
    { label: "Telefon:", value: users?.phone },
]

const footer = [
    { value: users?.name },
]
    
  return (
    <div className="w-full h-full border-4 rounded-lg border-gray-400 mt-6">
      <div className="px-3">
        <div className="border-b-2 py-3 mb-3">
            {infoFields.map((field, index) => (
            <div key={index} className={`flex ${field.label === "Fra:" ? "mt-6" : ""}`}>
                <p className="font-medium mr-1">{field.label}</p>
                <span>{field.value}</span>
            </div>
        ))}
        </div>
        
        <div className="mb-44">
            <h1 className="font-medium">Varsel om byggesøknad - Oppføring av garasje</h1>
            <p>I henhold til plan-og bygningsloven § 21-3 varsles du herved om at
                det vil bli sendt inn en byggesak til ______ kommune for oppføring
                av en frittstående garasje på min eiendom, {users?.address}.
            </p>
        </div>

        <div>
            <p>Tiltaket er i tråd med gjeldende reguleringsplan og krever ingen dispensasjon.</p>
            <h1 className="font-medium mt-1">Dine muligheter til å komme med merknader:</h1>
            <p>Dersom du har innspill eller merknader til dette tiltaket, kan du sende disse
                skriftlig til meg innen 14 dager fra datoen for dette varselet. Dersom du ikke 
                git tilbakemelding innen fristen, anses det som at du ikke har merknader til tiltaket.
            </p>
            <p className="mt-10">Vedlagt følger situasjonskart som viser plasseringen av garasjen.</p>
        </div>

        <div className="mt-6">
            <h1 className="font-medium">Kontaktinformasjon:</h1>
            {contactInfoFields.map((field, index) => (
                <div key={index} className="flex">
                    <p className="font-medium mr-1">{field.label}</p>
                    <span>{field.value}</span>
                </div>
            ))}

            <div className="mt-4 mb-10">
                <p className="font-medium">Vennlig hilsen,</p>
                {footer.map((field, index) => (
                <div key={index} className="flex">
                    <span>{field.value}</span>
                </div>
            ))}
            </div>
        </div>
        <div className="flex justify-center">
            <button className="w-96 my-3 py-2 border-2 border-kartAI-blue rounded-lg text-kartAI-blue hover:bg-kartAI-blue hover:text-white duration-300">
          Send nabovarsel
        </button>
        </div>
        
      </div>
    </div>
  )
}

export default Nabovarsel
