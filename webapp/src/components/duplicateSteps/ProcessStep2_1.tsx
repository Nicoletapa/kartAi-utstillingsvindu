import React from 'react'


const ProcessStep2_1 = () => {
        
  return (
    <div className='relative lg:pl-32 max-w-3xl'>
          <h1 className="text-3xl font-bold justify-center flex">Dispensasjon</h1>
          <h1 className='font-bold mt-4 justify-center flex'>Basert på informasjonen du har gitt så behøver du å søke om dispensasjon.</h1>
    
          <div className='border-4 rounded-lg border-blue-800 mt-4 p-4'>
              <h1 className='font-bold'>Hva er dispensasjon?</h1>
              <p><b>Dispensasjon</b> er et unntak fra gjeldende regler eller krav som normalt må følges. Det innebærer
              at en myndighet gir tillatelse til å fravike bestemmelser i lover, forskrifter eller reguleringsplaner
              når det fraligger særlige grunner.</p>
          </div>
    
          <div className='border-4 rounded-lg border-blue-800 mt-4 p-4'>
              <h1 className='font-bold'>Hva må du gjøre?</h1>
              <p>Du vil bli ført til dispensasjonssøknaden ved å trykke på knappen <b>&quot;Søk om dispensasjon&quot;</b> </p>
          </div>
    
          <button className="w-full my-3 py-2 border-2 border-kartAI-blue rounded-lg text-kartAI-blue hover:bg-kartAI-blue hover:text-white duration-300">
            Søk om dispensasjon
          </button>
        </div>
  )
}

export default ProcessStep2_1
