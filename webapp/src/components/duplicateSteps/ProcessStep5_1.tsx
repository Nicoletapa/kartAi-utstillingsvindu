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

const ProcessStep5_1 = () => {
    
  return (
    <div className="md:pl-20 mb-32">
          <h1 className="text-3xl font-bold justify-center flex">Byggesøknaden er godkjent</h1>
    
          <div className='mt-6 w-full' data-cy="main-container">
            <div className="flex flex-col md:flex-row">
    <div className='w-full md:w-2/4' data-cy="left-column">
                <p className='font-medium'>Når en byggesøknad er godkjent, kan du som tiltakshaver eller ansvarlig søker gå videre med byggeprosjektet.
                    Du har fått igangsettingstillatelse (IG).
                </p><br />
                <p className='font-medium'>Dette betyr at du nå har lov til å starte bygningen i henhold til godkjent søknad.</p>
            </div>
            <div className='w-full md:w-2/4 md:pl-6' data-cy="right-column">
                <div className='rounded-lg p-4 border-4 border-blue-800 flex flex-col items-center'>
                    <p className='text-center'>Hva du kan gjøre avhenger av hvilken type tillatelse du har fått:</p>
                    <ExternalLinkButton url='https://www.dibk.no/regelverk/sak'>
                        Les mer
                    </ExternalLinkButton>
                </div>
            </div>
            </div>
            
          </div>
          <h1 className='font-bold mt-6'>Neste steg:</h1>
          <ul className='list-disc'>
            <li><span className='font-medium'>Starte byggearbeidet</span> i henhold til godkjente tegninger og krav.</li>
            <li>Følge kravene til <span className='font-medium'>tilsyn og kontroll</span> (dersom tiltaket er søknadspliktig).</li>
            <li>Sørge for at ansvarlige foretak følger regler og fører nødvendige kontroller.</li>
          </ul>
        </div>  
  )
}

export default ProcessStep5_1
