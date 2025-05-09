import React from 'react';
import Nabovarsel from '../Nabovarsel';
import { ApplicationService } from '~/utils/api-service';

interface BruksendreStep3_1Props {
  applicationID: number;
}

const BruksendreStep3_1: React.FC<BruksendreStep3_1Props> = ({ applicationID }) => {
    const { saveField } = ApplicationService.useSaveFormData(applicationID, 'sma-prosjekter');

    void saveField('progress.currentStep', '3_1');

  return (
    <div className="justify-center flex md:pl-10">
      <div className="w-full max-w-4xl">
          <Nabovarsel />
      </div>
    </div>
  );
};

export default BruksendreStep3_1;