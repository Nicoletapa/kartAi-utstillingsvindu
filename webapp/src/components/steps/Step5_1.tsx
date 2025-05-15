import React from 'react'
import { ApplicationService } from '~/utils/api-service';
import ProcessStep5_1 from '../duplicateSteps/ProcessStep5_1';

interface Step5_1Props {
  applicationID: number;
}

const Step5_1: React.FC<Step5_1Props> = ({ applicationID }) => {
  const { saveField } = ApplicationService.useSaveFormData(applicationID, 'sma-prosjekter');

  void saveField('progress.currentStep', '5_1');

  return (
    <div>
      <ProcessStep5_1 />
    </div>
  )
}

export default Step5_1
