"use client"

import { Bot, Check, Plus } from 'lucide-react';
import React from 'react'
import Link from 'next/link'

const ForDuSoker = () => {

    interface HandleClickProps {
        url: string;
    }

    const handleClick = (url: HandleClickProps['url']): void => {
        window.open(url, '_blank', 'noreferrer');
    }

  return (
    <div className='p-4 px-20'>
      <h1 className='text-3xl pt-4 font-bold flex justify-center text-kartAI-blue mb-8'>Før du søker</h1>
        <p className='mb-4'>Før du søker, må du vite hvilke regler som gjelder for eiendommen din.</p>

      <div data-cy="main-container">
        <div className="flex flex-col md:flex-row">

        <div data-cy="left-column" className='flex flex-col w-3/6'>
        <h1 className='font-medium'>Dette må du vite før du starter søknaden:</h1>
        <ul className='list-disc ml-8'>
            <li>Seksjon 1: Trenger du å søke?</li>
            <li>Seksjon 2: Hva gjelder for din eiendom?</li>
            <li>Seksjon 3: Hva kan du søke om her?</li>
            <li>Seksjon 4: Hva bør du ha klart før du starter søknaden?</li>
            <li>Seksjon 5: Klar for å starte?</li>
        </ul>
        </div>
        
        <div data-cy="right-column" className='flex flex-col w-3/6 gap-8'>
            <iframe
            width="500"
            height="255"
            src="https://www.youtube.com/embed/s6oTf12Q-rY"
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="rounded-lg shadow-md"
            ></iframe>
        </div>
        </div>
      </div>

      <h1 className='font-medium text-2xl mb-2'>Trenger du å søke?</h1>
      <p>Ikke alle byggeprosjekter krever søknad. Før du setter deg i gang, bør du sjekke om
        tiltaket ditt er søknadspliktig.
      </p>

        <p className='font-medium mt-2 mb-2'>Her er noen eksempler:</p>
        <div data-cy="main container" className='border-2 border-gray-500 bg-blue-50 rounded-lg p-4'>
            <div className="flex flex-col md:flex-row">
                <div data-cy="left-column" className='flex flex-col w-3/6'>
                    <h1 className='font-medium text-center mb-1'>Du må søke hvis du skal:</h1>
                    <ul className='list-disc ml-7 space-y-1'>
                        <li>Bygge nytt bygg eller tilbygg</li>
                        <li>Gjøre bruksendring (f.eks. fra bod til bolig)</li>
                        <li>Rive bygg</li>
                        <li>Bygge nær nabo eller i strid med reguleringsplan</li>
                    </ul>
                </div>
                <div data-cy="right-column" className='flex flex-col w-3/6 border-l-2 border-gray-500'>
                <h1 className='font-medium text-center mb-1'>Du trenger ikke søke hvis tiltaket:</h1>
                    <ul className='list-disc ml-12 space-y-1'>
                        <li>Mindre bygg under 15m² (f.eks. enkel bod eller lekestue)</li>
                        <li>Innenfor reglene for avstand og høyde</li>
                        <li>Ikke i strid med reguleringsplan</li>
                    </ul>
                </div>
            </div>
        </div>

        <p className='mt-8'>Er du usikker på om du må søke? Du kan bruke veiviseren eller chatte med chatbotten vår for veiledning.</p>
        <button onClick={() => handleClick("https://www.dibk.no/hjelp?_t_q=veiviser%20for%20bygg")} className='my-3 py-2 px-4 border-2 border-kartAI-blue rounded-lg text-kartAI-blue hover:bg-kartAI-blue hover:text-white duration-300'>
            Til DiBK veiviseren
        </button>

        <h1 className='font-medium mt-8 text-2xl'>Hva gjelder for din eiendom?</h1>
        <p className='mt-2 mb-4'>Før du søker, bør du finne ut hvilke regler som gjelder for din eiendom. Det er disse som avgjør hva du kan bygge - og hvordan.</p>
        
        <h2 className='font-medium'>Sjekk spesielt:</h2>
        <ul className='list-disc ml-8 space-y-1'>
            <li>Kommuneplanen - overordnede føringer for arealbruk</li>
            <li>Reguleringsplanen - detaljerte regler for akkurat ditt område</li>
            <li>Områdeplanen - hvis det finnes, gir ekstra detaljer og hensyn</li>
        </ul>

        <h2>Planene viser:</h2>
        <ul className='list-disc ml-8 space-y-1 mb-4'>
            <li>Hva eiendommen er regulert til (f.eks. bolig, fritidsbolig, næring)</li>
            <li>Om det finnes byggegrenser eller verneverdier</li>
            <li>Om tiltaket ditt krever dispensasjon</li>
        </ul>

        <p className='mb-1'>Denne informasjonen kan du finne under <span className='font-medium'>Min Eiendom</span>.</p>
        <p className="italic flex items-center gap-2">
  <Bot size={20} />
  Chatbotten kan også hjelpe deg med å tolke hva som gjelder for din eiendom.
</p>

<h1 className='text-2xl font-medium mt-8 mb-2'>Hvilke tiltak støtter løsningen?</h1>
<p>I denne løsningen kan du søke digitalt om tre tiltakstyper:</p>
<ul className='list-disc ml-8 space-y-1 mb-4'>
    <li>Bruksendring - f.eks. gjøre om bog til oppholdsrom</li>
    <li>Bygge - f.eks. tilbygg, garasje, bod eller nybygg</li>
    <li>Rive - fjerne eksisterende bygg eller deler av bygg</li>
</ul>

<h1 className='text-2xl font-medium mt-8 mb-2'>Hva bør du ha klart før du starter søknaden?</h1>
<p>For å kunne lage en komplett søknad, er det lurt å ha disse tingene klare:</p>
<ul className='list-disc ml-8 space-y-1 mb-4'>
    <li>Situasjonskart over eiendommen</li>
    <li>Tegninger (plan, fasade, snitt)</li>
    <li>Nabovarsel (hvis det er påkrevd)</li>
    <li>Beskrivelse av tiltaket</li>
    <li>Kontaktinformasjon til ansvarlig søker (hvis det kreves)</li>
</ul>
<p>Alt dette får du hjelp til gjennom sjekklisten når du starter søknaden.</p>

<h1 className='text-2xl font-medium mt-8 mb-2'>Klar for å starte?</h1>
<p>Du kan velge hvordan du vil komme i gang:</p>
<ul className='list-disc ml-8 space-y-1 mb-4'>
    <li>
    <Link href="/atlas-app" className="flex items-center gap-2 hover:underline">
      <Plus size={20} />
      Start ny søknad
    </Link>
    </li>
    <li>
    <Link href="/atlas-app/sidebar/sjekkliste" className="flex items-center gap-2 hover:underline">
      <Check size={20} />
      Gå til sjekkliste
    </Link>
    </li>
    <li>
    <Link href="/atlas-app" className="flex items-center gap-2 hover:underline">
      <Bot size={20} />
      Start med chatbotten for veiledning
    </Link>
    </li>
</ul>
    </div>
  )
}

export default ForDuSoker
