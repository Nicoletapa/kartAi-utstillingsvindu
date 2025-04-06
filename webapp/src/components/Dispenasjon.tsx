import React from 'react'

const header = [
    { value: "[Kommunenavn]"},
    { value: "[Byggesaksavdeling]"},
    { value: "[Adresse]"},
    { value: "[Postnummer], [Poststed]"},
    { value: "[Telefonnummer]"},
    { value: "[E-post]"},
    { label: "Saksnummer:", value: " [Saksnummmer]" },
    { label: "Dato:", value: "[Dato]" },

]

const infoFields = [
    { label: "Søker:", value: "[Navn på søker]" },
    { label: "Adresse:", value: "[Søkers adresse]" },
    { label: "Eiendom:", value: "[Adresse til eiendommen]" },
    { label: "Gnr./Bnr:", value: "[Gårds- og bruksnummer]" },
    { label: "Tiltakets art:", value: "[Kort beskrivelse av byggesøknaden f.eks. nybygg, ombygging, tilbygg, etc.]" },
]

const detaljerInfoFields = [
    { label: "Størrelse:", value: "[Størrelse] m²" },
    { label: "Materiale:", value: "[Materiale]" },
    { label: "Høyde:", value: "[Høyde] meter" },
    { label: "Takvinkel:", value: "[Grader] grader" },
    { label: "Avstand til nabogrense:", value: "[Meter] meter" }
]

const footer = [
   { value: "[Underskrift]"},
   { value: "[Navn på søker]"}

]

const Dispensasjon = () => {
  return (
    <div className="w-full border-4 rounded-lg border-gray-400 mt-6">
      <div className="px-3">
        <div className="border-b-2 py-3 mb-3">
            {header.map((field, index) => (
            <div key={index} className={`flex ${field.label === "Saksnummer:" ? "mt-6" : ""}`}>
                <p className={`flex font-medium ${field.label === "Saksnummer:" ? "mr-1" : ""}`}>{field.label}</p>
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
            <p>[En kort beskrivelse av tiltaket, f.eks. hva du ønsker å bygge, hvor det skal plasseres, 
                og hvordan det er i samsvarmed eller avviker fra gjeldende reguleringsplaner.
                Dette kan inkludere eventuelle spesielle omstendigeter som gjør at du søker om dispensasjon.]</p>
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
