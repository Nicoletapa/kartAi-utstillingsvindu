import React from 'react'
import { ApplicationService } from '~/utils/api-service';
import ProcessStep6_0 from '../duplicateSteps/ProcessStep6_0';

interface BruksendreStep6_0Props {
  applicationID: number;
}

const BruksendreStep6_0: React.FC<BruksendreStep6_0Props> = ({ applicationID }) => {
  const { saveField } = ApplicationService.useSaveFormData(applicationID, 'sma-prosjekter');

  void saveField('progress.currentStep', '6_0');

  return (
    <div className='items-center justify-center flex mx-auto'>
      <ProcessStep6_0 />
    </div>
  )
}

export default BruksendreStep6_0