import React from 'react'

const KortFortaltSoknad = () => {
  return (
    <div className=' rounded-lg shadow-md border-2 p-4 mb-4 min-w-72 h-full max-w-80 bg-gray-100'>
      <h2 className="text-lg font-semibold text-center">
              Kort Fortalt:
        </h2>
        <div>  
            <p>Her fyller du ut informasjon om tiltakets størrelse, høyde og avstand til nabogrenser,
                veier og infrastruktur. Du må også oppgi hvordan utnyttelsen av tomten beregnes og vurdere
                om tiltaket følger reguleringsplanen. Hvis det ikke er i tråd med planen, vil du få muligheten 
                til å søke om dispensasjon i senere steg.
            </p>
        </div>
    </div>
  )
}

export default KortFortaltSoknad
