import React from 'react';
import { ApplicationService } from '~/utils/api-service';
import ProcessStep3_0 from '../duplicateSteps/ProcessStep3_0';

interface BruksendreStep3_0Props {
  applicationID: number;
}

const BruksendreStep3_0: React.FC<BruksendreStep3_0Props> = ({ applicationID }) => {
  const { saveField } = ApplicationService.useSaveFormData(applicationID, 'sma-prosjekter');

  void saveField('progress.currentStep', '3_0');

  return (
    <div>
      <ProcessStep3_0 />
    </div>
  );
};

export default BruksendreStep3_0;