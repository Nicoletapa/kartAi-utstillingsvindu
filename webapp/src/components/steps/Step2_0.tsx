import React, { useEffect } from 'react';
import CadaidAtlas from '../CadaidAtlas';
import { ApplicationService } from '~/utils/api-service';

interface Step2_0Props {
  applicationID: number;
  onValidityChange: (isValid: boolean) => void;
}

const Step2_0: React.FC<Step2_0Props> = ({ applicationID, onValidityChange }) => {
    const { saveField, isSaving } = ApplicationService.useSaveFormData(applicationID, 'sma-prosjekter');
  // Mark this step as valid when component mounts
  useEffect(() => {
    onValidityChange(true);
  }, [onValidityChange]);

  void saveField('progress.currentStep', '2_0');


  if (!applicationID) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-600 font-medium">Error: No application ID provided.</p>
        <p className="text-gray-700">Please create or select an application first.</p>
      </div>
    );
  }
  return (
    <div>
      
        <CadaidAtlas applicationID={applicationID} />
      
    </div>
  );
};

export default Step2_0;