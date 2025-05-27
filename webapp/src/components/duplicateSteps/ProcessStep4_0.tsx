import React from 'react'
import AndreVedlegg from '../AndreVedlegg';



interface Process4_0Props {
  applicationID: number;
}

const Process4_0: React.FC<Process4_0Props> = ({ applicationID }) => {
    

  

  return (
    <div>
       <AndreVedlegg onUpload={(files) => console.log('Uploaded files:', files)} applicationID={applicationID}/>
    </div>
  )
}

export default Process4_0
