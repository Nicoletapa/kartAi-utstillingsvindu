import React from 'react'
import AndreVedlegg from '../AndreVedlegg';
import { ApplicationService } from '~/utils/api-service';

interface BruksendreStep4_0Props {
  applicationID: number;
}

const BruksendreStep4_0: React.FC<BruksendreStep4_0Props> = ({ applicationID }) => {
    const { saveField } = ApplicationService.useSaveFormData(applicationID, 'sma-prosjekter');

    void saveField('progress.currentStep', '4_0');

  return (
    <div>
       <AndreVedlegg onUpload={(files) => console.log('Uploaded files:', files)} />
    </div>
  )
}

export default BruksendreStep4_0
