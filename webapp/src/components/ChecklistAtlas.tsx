"use client"

import React, { useState } from 'react'

const checklistData = {
    for: [
        {
            title: "1. Forberedelser før søknad",
            items: [
                "Sjekk reguleringsplaner og bestemmelser: Undersøk om det er midlertidig forbud mot bygging eller deling i området ditt.",
                "Vurder grunnforhold: Sjekk om eiendommen kan være på forurenset grunn eller om den ligget i et flomutsatt område, som for eksempel nær Tovdalselva eller områder med kvikkleire.",
                "Avklar behov for dispensasjon: Hvis tiltaket ditt krever unntak fra gjedene planer eller bestemmelser, må du søke om dispensasjon. Husk at slike søknader også må nabovarsles.",
            ]
        }
    ],

    under: [
        {
            title: "2. Utarbeidelse av situasjonsplan",
            items: [
                "Bruk gyldig situasjonskart. Sørg for at situasjonsplanen er basert på et oppdatert kart fra kommunen.",
                "Tegn inn tiltaket nøyaktig: Marker det planlagte tiltaket tydelig, med korrekte mål og avstander til nabogrense, nærliggende bygg, vei, høyspentlinjer og eksisterende vann- og avløpsledninger."
            ]
        },
        {
            title: "3. Utarbeidelse av nødvendige tegninger",
            items: [
                "Plan-, snitt-, og fasadetegninger: Lag detaljerte tegninger som viser både eksisterende og planlagt bebyggelse.",
                "Målestokk og nøyaktighet: Tegningene skal være i målestokk 1:100 og inneholde alle relevante mål.",
            ]
        },
        {
            title: "4. Nabovarsling",
            items: [
                "Hent naboliste: Få en oversikt over berørte naboer via kommunens tjenester.",
                "Send nabovarsel: Informer naboene om planlagte tiltak. Bruk standard skjemaer tilgjengelig fra kommunen.",
                "Vent på tilbakemeldinger: Gi naboene minst to uker til å komme med eventuelle merknader.",
            ]
        },
        {
            title: "5. Innsending av søknad",
            items: [
                "Fyll ut søknadsskjema: Bruk denne digitale løsningen eller kommunens skjemaer for byggesøknad.",
                "Legg ved nødvendige vedlegg: Inkluder situasjonsplan, tegninger, nabovarsel og eventuelle dispensasjonssøknader.",
                "Om du bruker kommunens skjemaer, send søknaden til kommunen: Innsendingen kan gjøres elektronisk til post.byutvikling@kristiansand.kommune.no.",
            ]
        }
    ],

    etter: [
        {
            title: "6. Betaling av gebyr",
            items: [
                "Vær oppmerksom på gebyrer: Byggesaksbehandling medfører gebyrer. Sjekk kommunens betalingssatser for byggesak.",
            ]
        },
        {
            title: "7. Ferdigattest, midlertidig brukstillatelse, og melding om ikke søknadspliktige tiltak til matrikkel",
            items: [
                "Ferdigattest for tiltak med søknadsplikt: Når byggverket er ferdig, må du søke om ferdigattest. Tiltak kan ikek tas i bruk før kommunen har gitt ferdigattest eller midlertidig brukstillatelse.",
                "Midlertidig brukstillatelse: Midlertidig brukstillatelse betyr at du kan ta tiltaket i bruk, men at de siste manglene må gjennomføres innen en frist kommunen setter for at du skal kunne få ferdigattest.",
                "Melding om ikke søknadspliktige tiltak til matrikkel: Hvis du skal ferdigmelde et tiltak som er unntatt søknadsplikt skal du melde dette til kommunen slik at tiltaket kommer med på kartet. Husk å legge ved et situasjonskart med tiltaket inntegnet og målsatt.",
            ]
        }
    ],
}

const CustomCheckbox = ({ 
    checked, 
    onChange 
}: { 
    checked: boolean; 
    onChange: () => void 
}) => (
    <div 
        className={`
            relative top-[3px]
            inline-flex shrink-0 items-center justify-center
            w-5 h-5 min-w-[20px] min-h-[20px]
            border-2 rounded 
            transition-colors duration-200 ease-in-out
            cursor-pointer select-none
            ${checked ? 'bg-kartAI-blue border-kartAI-blue' : 'border-gray-300 bg-white'}
        `}
        onClick={onChange}
        role="checkbox"
        aria-checked={checked}
    >
        {checked && (
            <svg 
                className="w-[14px] h-[14px] text-white absolute"  // Fixed SVG size
                viewBox="0 0 24 24" 
                stroke="currentColor"
                strokeWidth={3}
                fill="none"
            >
                <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M5 13l4 4L19 7" 
                />
            </svg>
        )}
    </div>
)

const ChecklistAtlas = () => {
    const [activeTab, setActiveTab] = useState<'for' | 'under' | 'etter'>('for')
    const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({})

    const handleCheckboxChange = (item: string) => {
        setCheckedItems(prev => ({
            ...prev,
            [item]: !prev[item]
        }))
    }

    const allItems = Object.values(checklistData).flatMap(section => 
        section.flatMap(sub => sub.items)
    )
    const checkedCount = Object.keys(checkedItems).filter(key => checkedItems[key]).length
    const progressPercent = Math.round((checkedCount / allItems.length) * 100) 

  return (
    <div className='p-4'>
        <h1 className="text-3xl pt-4 font-bold flex justify-center text-kartAI-blue mb-8">Sjekkliste</h1>
        <p className="text-xl md:mx-20 px-6 mb-4 flex justify-center">
        Her finner du en oversikt over hvilke dokumenter og opplysninger som kreves for at søknaden din
        skal være komplett. <br /><br />
        Det er laget en sjekkliste for de ulike fasene i søknadsprosessen: Før, Under,
        og Etter. Velg et av disse alternativene for å se sjekklisten for den fasen.
      </p>

          <div className='md:mx-24 flex justify-center'>
              {(['for', 'under', 'etter'] as const).map((cat) => (
                  <button
                      key={cat}
                      onClick={() => setActiveTab(cat)}
                      className={`flex-1 text-xl text-center py-2 font-medium transition-all ${activeTab === cat ? 'border-b-4 border-kartAI-blue text-kartAI-blue' : 'text-gray-400 hover:text-kartAI-blue'}`}
                  >
                      {cat === 'for' ? 'Før' : cat === 'under' ? 'Under' : 'Etter'}
                  </button>
              ))}
          </div>

      <div className='w-full md:w-2/3 mx-auto mt-6 mb-8 px-6'>
        <div className='w-full bg-gray-200 rounded-full h-4'>
            <div className='bg-kartAI-blue h-4 rounded-full transition-all duration-300 ease-in-out' style={{ width: `${progressPercent}%` }} />
            <div className='text-sm text-gray-600 mt-2 text-center'>
                Fremdrift: {progressPercent}%
            </div>
        </div>
        </div>

        <div className='mt-6 md:mx-20 px-6 space-y-8'>
            {checklistData[activeTab].map((section, idx) => (
                <div key={idx}>
                    <h3 className='text-xl font-semibold text-kartAI-blue mb-3'>{section.title}</h3>
                    <div className='space-y-3'>
                        {section.items.map((item, i) => (
                            <label key={i} className='flex items-baseline gap-3 text-lg text-gray-700 min-h-[28px]'>
                                <div className='flex-none'>
                                    <CustomCheckbox
                                        checked={checkedItems[item] || false}
                                        onChange={() => handleCheckboxChange(item)}
                                    />
                                </div>
                                
                                <span className='leading-snug flex-1'>{item}</span>
                            </label>
                        ))}
                    </div>
                </div>
            ))}
        </div>
      </div>
  )
}




export default ChecklistAtlas
