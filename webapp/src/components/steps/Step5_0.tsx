import React from 'react'
import { ApplicationService } from '~/utils/api-service';
import ProcessStep5_0 from '../duplicateSteps/ProcessStep5_0';

interface Step5_0Props {
  applicationID: number;
}

const Step5_0: React.FC<Step5_0Props> = ({ applicationID }) => {
  const { saveField } = ApplicationService.useSaveFormData(applicationID, 'sma-prosjekter');

  void saveField('progress.currentStep', '5_0');

  return (
    <div>
      <ProcessStep5_0 />
    </div>
  )
}

export default Step5_0
