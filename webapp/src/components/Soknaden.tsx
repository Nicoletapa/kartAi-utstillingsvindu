import React from 'react'

const byggInfoFields = [
    { label: "Tiltakstype:", value: "[Tiltak]" },
    { label: "Adresse:", value: "[Adresse]" },
    { label: "Kommune:", value: "[Kommune]" },
    { label: "Tiltakshaver:", value: "[Fornavn] [Etternavn], [Adresse], [Postnummer] [Sted]" },
    { label: "Ansvarlig søker:", value: "[Navn/selvbygger]" }
]

const detaljerInfoFields = [
    { label: "Størrelse:", value: "[Størrelse] m²" },
    { label: "Materiale:", value: "[Materiale]" },
    { label: "Høyde:", value: "[Høyde] meter" },
    { label: "Takvinkel:", value: "[Grader] grader" },
    { label: "Avstand til nabogrense:", value: "[Meter] meter" }
]

const Soknaden = () => {

    
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
                <p className='mb-4'>[Hva tiltaket er]</p>
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
                <ul className='list-disc ml-7 mb-4'>
                    <li>[Beskrivelse av hva situasjonskartet viser]</li>
                    <li>[Beskrivelse av hva fasadetegningene viser]</li>
                    <li>[Beskrivelse av hva plantegningen viser]</li>
                    <li>[Beskrivelse av hva snittegningen viser]</li>
                    [Andre vedlegg]
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
                <p className='mb-4'>Tiltakshaver [Navn] står selv ansvarlig for tiltaket, da det er innenfor
                    unntaker for ansvarsrett iht. plan- og bygningsloven.
                </p>
            </div>

            <div>
                <h1 className='font-medium text-xl m1-7'>Vedlegg</h1>
                <ul className='list-disc ml-7 mb-7'>
                    <li>[Vedlegg]</li>
                    <li>[Vedlegg]</li>
                    <li>[Vedlegg]</li>
                    <li>[Vedlegg]</li>
                    <li>[Vedlegg]</li>
                </ul>
            </div>
        </div>
    </div>
  )
}

export default Soknaden
