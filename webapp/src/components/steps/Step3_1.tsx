import React from 'react';
import Nabovarsel from '../Nabovarsel';
import { ApplicationService } from '~/utils/api-service';

interface Step3_1Props {
  applicationID: number;
}

const Step3_1: React.FC<Step3_1Props> = ({ applicationID }) => {
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

export default Step3_1;