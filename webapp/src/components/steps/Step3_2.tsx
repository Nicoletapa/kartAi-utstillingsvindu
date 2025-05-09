import React, { useEffect } from 'react'
import { ApplicationService  } from '~/utils/api-service';
import ProcessStep3_2 from '../duplicateSteps/ProcessStep3_2';

interface Step3_2Props {
    applicationID: number;
}

const Step3_2: React.FC<Step3_2Props> = ({ applicationID }) => {
    const { saveField, isSaving } = ApplicationService.useSaveFormData(applicationID, 'sma-prosjekter');

    void saveField('progress.currentStep', '3_2');

    useEffect(() => {
        console.log('Changes Saved:', isSaving);
    }, [isSaving]);

    return (
        <div>
            <ProcessStep3_2 />
        </div>
    );
};

export default Step3_2
