import React from 'react'
import { ApplicationService } from '~/utils/api-service';
import ProcessStep2_1 from '../duplicateSteps/ProcessStep2_1';

interface Step2_1Props {
  applicationID: number;
}

const Step2_1: React.FC<Step2_1Props> = ({ applicationID }) => {
    const { saveField } = ApplicationService.useSaveFormData(applicationID, 'sma-prosjekter')

    void saveField('progress.currentStep', '2_1');

  return (
    <div>
      <ProcessStep2_1 />
    </div>
  )
}

export default Step2_1
