import React from 'react'
import { ApplicationService } from '~/utils/api-service';
import ProcessStep3_2 from '../duplicateSteps/ProcessStep3_2';

interface BruksendreStep3_2Props {
    applicationID: number;
}

const BruksendreStep3_2: React.FC<BruksendreStep3_2Props> = ({ applicationID }) => {
    const { saveField } = ApplicationService.useSaveFormData(applicationID, 'sma-prosjekter');

    void saveField('progress.currentStep', '3_2');

    return (
        <div>
            <ProcessStep3_2 />
        </div>
    );
};

export default BruksendreStep3_2
