import React, { useEffect } from 'react';
import CadaidAtlas from '../CadaidAtlas';


interface ProcessStep2_0Props {
  applicationID: number;
  onValidityChange: (isValid: boolean) => void;
}

 const ProcessStep2_0: React.FC<ProcessStep2_0Props> = ({ applicationID, onValidityChange }) => {
  useEffect(() => {
    onValidityChange(true);
  }, [onValidityChange]);
  
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

export default ProcessStep2_0;