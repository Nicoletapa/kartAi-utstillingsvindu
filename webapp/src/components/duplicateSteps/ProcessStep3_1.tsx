import React from 'react';
import Nabovarsel from '../Nabovarsel';


interface ProcessStep3_1Props {
  applicationID: number;
}

const ProcessStep3_1: React.FC<ProcessStep3_1Props> = ({ applicationID }) => {
  
    

  return (
    <div className="justify-center flex md:pl-10">
      <div className="w-full max-w-4xl">
          <Nabovarsel applicationID={applicationID} />
      </div>
    </div>
  );
};

export default ProcessStep3_1;