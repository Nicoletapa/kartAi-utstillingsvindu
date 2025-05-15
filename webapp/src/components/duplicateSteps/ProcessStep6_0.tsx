import React from 'react'

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

const ProcessStep6_0 = () => {

  return (
    <div className="mb-20 flex flex-col items-center justify-center mx-auto px-4 w-full max-w-4xl">
      <div className="w-full flex flex-col items-center">
        <h1 className="text-3xl font-bold flex items-center justify-center">
          Hva må du gjøre videre?
        </h1>

        <div className="mt-6 w-full max-w-2xl">
          <p>Før du skal ta bygget i bruk, må du enten:</p>
          <ul className="list-disc space-y-1 pl-7">
            <li className="text-left">
              <span className="font-medium">Midlertidig tillatelse</span> - hvis bygget ikke er helt ferdig, men kan brukes med noen begrensninger.
            </li>
            <li className="text-left">
              <span className="font-medium">Ferdigattest</span> - når alt er fullført i henhold til søknaden.
            </li>
          </ul>

          <p className="font-bold mt-6">For å få ferdigattest:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li className="text-left">Dokumentasjon på at alle krav er fulgt sendes til kommunen.</li>
            <li className="text-left">Kontroller at alt arbeid er utført i henhold til tillatelsen.</li>
          </ul>
        </div>

        <div className='space-x-4 flex flex-row items-start mt-4 w-full max-w-2xl'>
          <ExternalLinkButton url='https://www.dibk.no/globalassets/blanketter_utfyllbare/alle-blanketter/5169-soknad-om-midlertidig-brukstillatelse-2020.pdf'>
            Søknad om midlertidig brukstillatelse
          </ExternalLinkButton>
          <ExternalLinkButton url='https://www.dibk.no/globalassets/blanketter_utfyllbare/alle-blanketter/5167-soknad-om-ferdigattest-2020.pdf'>
            Søknad om ferdigattest
          </ExternalLinkButton>
        </div>

        <div className="border-4 border-blue-800 bg-blue-100 p-4 rounded-lg mt-4 w-full max-w-2xl">
          <h1 className="font-bold text-center">Viktig å huske!</h1>
          <ul className="list-disc space-y-1 pl-7">
            <li className="text-left">Byggearbeidet må starte innen 3 år og være ferdig innen 5 år fra vedtaket, ellers må du søke på nytt.</li>
            <li className="text-left">Dersom det skjer endringer underveis i prosjektet, må du melde fra til kommunen og eventuelt søke om endringstillatelse.</li>
            <li className="text-left">Forsikre deg om at du har alle nødvendige godkjenninger før du begynner å bruke bygget.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default ProcessStep6_0
