"use client"

import { Bot, Check, Plus } from 'lucide-react';
import React from 'react';
import Link from 'next/link';

interface SectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

const Section: React.FC<SectionProps> = ({ title, children, className = '' }) => (
  <section className={`mb-8 ${className}`}>
    <h1 className='text-2xl font-medium mb-2'>{title}</h1>
    {children}
  </section>
);

const BulletList: React.FC<{ items: React.ReactNode[] }> = ({ items }) => (
  <ul className='list-disc ml-8 space-y-1 mb-4'>
    {items.map((item, index) => (
      // The key should be on the outermost element returned by map
      <li key={index}>{item}</li>
    ))}
  </ul>
);

const VideoEmbed: React.FC = () => (
  <iframe
    width="500"
    height="255"
    src="https://www.youtube.com/embed/s6oTf12Q-rY"
    title="YouTube video player"
    frameBorder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowFullScreen // Use allowFullScreen instead of allowfullscreen
    className="rounded-lg shadow-md"
  />
);

const TwoColumnList: React.FC<{
  leftTitle: string;
  leftItems: string[];
  rightTitle: string;
  rightItems: string[];
}> = ({ leftTitle, leftItems, rightTitle, rightItems }) => (
  <div className='border-2 border-gray-500 bg-blue-50 rounded-lg p-4'>
    <div className="flex flex-col md:flex-row">
      <div data-cy="left-column" className='flex flex-col w-full md:w-1/2 pr-4'>
        <h1 className='font-medium text-center mb-1'>{leftTitle}</h1>
        {/* Pass React nodes directly, BulletList handles the key */}
        <BulletList items={leftItems.map((item, index) => <span key={index}>{item}</span>)} />
      </div>
      <div data-cy="right-column" className='flex flex-col w-full md:w-1/2 md:border-l-2 md:border-gray-500 md:pl-4'>
        <h1 className='font-medium text-center mb-1'>{rightTitle}</h1>
        {/* Pass React nodes directly, BulletList handles the key */}
        <BulletList items={rightItems.map((item, index) => <span key={index}>{item}</span>)} />
      </div>
    </div>
  </div>
);

const ExternalLinkButton: React.FC<{
  url: string;
  children: React.ReactNode
}> = ({ url, children }) => {
  const handleClick = () => {
    window.open(url, '_blank', 'noreferrer');
  };

  return (
    <button
      onClick={handleClick}
      className='my-3 py-2 px-4 border-2 border-kartAI-blue rounded-lg text-kartAI-blue hover:bg-kartAI-blue hover:text-white duration-300'
    >
      {children}
    </button>
  );
};

const ActionLink: React.FC<{
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode
}> = ({ href, icon, children }) => (
  <Link href={href} className="flex items-center gap-2 hover:underline">
    {icon}
    {children}
  </Link>
);

const ForDuSoker = () => {
  return (
    <div className='p-4 md:mx-20'>
      <h1 className='text-3xl pt-4 font-bold flex justify-center text-kartAI-blue mb-8'>
        Før du søker
      </h1>
      <p className='mb-4'>
        Før du søker, må du vite hvilke regler som gjelder for eiendommen din.
      </p>

      <div data-cy="main-container">
        <div className="flex flex-col md:flex-row gap-8 mb-8">
          <div data-cy="left-column" className='w-full md:w-1/2'>
            <h1 className='font-medium mb-2'>Dette må du vite før du starter søknaden:</h1>
            {/* BulletList handles keys internally */}
            <BulletList items={[
              "Seksjon 1: Trenger du å søke?",
              "Seksjon 2: Hva gjelder for din eiendom?",
              "Seksjon 3: Hva kan du søke om her?",
              "Seksjon 4: Hva bør du ha klart før du starter søknaden?",
              "Seksjon 5: Klar for å starte?"
            ]} />
          </div>

          <div data-cy="right-column" className='w-full md:w-1/2'>
            <VideoEmbed />
          </div>
        </div>
      </div>

      <Section title="Trenger du å søke?">
        <p>
          Ikke alle byggeprosjekter krever søknad. Før du setter deg i gang, bør du sjekke om
          tiltaket ditt er søknadspliktig.
        </p>
        <p className='font-medium mt-2 mb-2'>Her er noen eksempler:</p>
        <TwoColumnList
          leftTitle="Du må søke hvis du skal:"
          leftItems={[
            "Bygge nytt bygg eller tilbygg",
            "Gjøre bruksendring (f.eks. fra bod til bolig)",
            "Rive bygg",
            "Bygge nær nabo eller i strid med reguleringsplan"
          ]}
          rightTitle="Du trenger ikke søke hvis tiltaket:"
          rightItems={[
            "Mindre bygg under 15m² (f.eks. enkel bod eller lekestue)",
            "Innenfor reglene for avstand og høyde",
            "Ikke i strid med reguleringsplan"
          ]}
        />
        <p className='mt-4'>
          Er du usikker på om du må søke? Du kan bruke veiviseren eller chatte med chatbotten vår for veiledning.
        </p>
        <ExternalLinkButton url="https://www.dibk.no/hjelp?_t_q=veiviser%20for%20bygg">
          Til DiBK veiviseren
        </ExternalLinkButton>
      </Section>

      <Section title="Hva gjelder for din eiendom?">
        <p className='mt-2 mb-4'>
          Før du søker, bør du finne ut hvilke regler som gjelder for din eiendom. Det er disse som avgjør hva du kan bygge - og hvordan.
        </p>
        <h2 className='font-medium'>Sjekk spesielt:</h2>
        {/* BulletList handles keys internally */}
        <BulletList items={[
          "Kommuneplanen - overordnede føringer for arealbruk",
          "Reguleringsplanen - detaljerte regler for akkurat ditt område",
          "Områdeplanen - hvis det finnes, gir ekstra detaljer og hensyn"
        ]} />
        <h2>Planene viser:</h2>
        {/* BulletList handles keys internally */}
        <BulletList items={[
          "Hva eiendommen er regulert til (f.eks. bolig, fritidsbolig, næring)",
          "Om det finnes byggegrenser eller verneverdier",
          "Om tiltaket ditt krever dispensasjon"
        ]} />
        <p className='mb-1'>
          Denne informasjonen kan du finne under <span className='font-medium'>Min Eiendom</span>.
        </p>
        <p className="italic flex items-center gap-2">
          <Bot size={20} />
          Chatbotten kan også hjelpe deg med å tolke hva som gjelder for din eiendom.
        </p>
      </Section>

      <Section title="Hvilke tiltak støtter løsningen?">
        <p>I denne løsningen kan du søke digitalt om tre tiltakstyper:</p>
        {/* BulletList handles keys internally */}
        <BulletList items={[
          "Bruksendring - f.eks. gjøre om bog til oppholdsrom",
          "Bygge - f.eks. tilbygg, garasje, bod eller nybygg",
          "Rive - fjerne eksisterende bygg eller deler av bygg"
        ]} />
      </Section>

      <Section title="Hva bør du ha klart før du starter søknaden?">
        <p>For å kunne lage en komplett søknad, er det lurt å ha disse tingene klare:</p>
        {/* BulletList handles keys internally */}
        <BulletList items={[
          "Situasjonskart over eiendommen",
          "Tegninger (plan, fasade, snitt)",
          "Nabovarsel (hvis det er påkrevd)",
          "Beskrivelse av tiltaket",
          "Kontaktinformasjon til ansvarlig søker (hvis det kreves)"
        ]} />
        <p>Alt dette får du hjelp til gjennom sjekklisten når du starter søknaden.</p>
      </Section>

      <Section title="Klar for å starte?">
        <p>Du kan velge hvordan du vil komme i gang:</p>
        {/* BulletList handles keys internally for <li>, but React needs keys on the array elements passed */}
        <BulletList items={[
          // Add unique keys to each element in the array
          <ActionLink key="start-ny" href="/atlas-app/sidebar/soknader" icon={<Plus size={20} />}>
            Start ny søknad
          </ActionLink>,
          <ActionLink key="ga-til-sjekkliste" href="/atlas-app/sidebar/sjekkliste" icon={<Check size={20} />}>
            Gå til sjekkliste
          </ActionLink>,
          <ActionLink key="start-chatbot" href="/atlas-app" icon={<Bot size={20} />}>
            Start med chatbotten for veiledning
          </ActionLink>
        ]} />
      </Section>
    </div>
  );
};

export default ForDuSoker;