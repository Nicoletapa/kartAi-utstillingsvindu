import React from 'react'
import { ApplicationService } from '~/utils/api-service';
import ProcessStep5_0 from '../duplicateSteps/ProcessStep5_0';

interface BruksendreStep5_0Props {
  applicationID: number;
}

const BruksendreStep5_0: React.FC<BruksendreStep5_0Props> = ({ applicationID }) => {
  const { saveField } = ApplicationService.useSaveFormData(applicationID, 'sma-prosjekter');

  void saveField('progress.currentStep', '5_0');

  return (
    <ProcessStep5_0 />
  )
}

export default BruksendreStep5_0
