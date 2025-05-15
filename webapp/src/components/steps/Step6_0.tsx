import React from 'react'
import { ApplicationService } from '~/utils/api-service';
import ProcessStep6_0 from '../duplicateSteps/ProcessStep6_0';

interface Step6_0Props {
  applicationID: number;
}

const Step6_0: React.FC<Step6_0Props> = ({ applicationID }) => {
  const { saveField } = ApplicationService.useSaveFormData(applicationID, 'sma-prosjekter');
  
  void saveField('progress.currentStep', '6_0');

  return (
    <div className='items-center justify-center flex mx-auto'>
      <ProcessStep6_0 />
    </div>
  )
}

export default Step6_0