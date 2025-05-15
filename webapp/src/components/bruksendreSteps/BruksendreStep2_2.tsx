import React from 'react';
import Dispensasjon from '../Dispensasjon';
import { ApplicationService } from '~/utils/api-service';
import { api } from '~/trpc/react';

interface BruksendreStep2_2Props {
  applicationID: number;
}

const BruksendreStep2_2: React.FC<BruksendreStep2_2Props> = ({ applicationID }) => {
    const { saveField } = ApplicationService.useSaveFormData(applicationID, 'sma-prosjekter');

    const { data: applicationData, isLoading: isLoadingApplication } = api.application.getApplication.useQuery(
        { applicationID },
        { enabled: !isNaN(applicationID) }
    );

    const { data: userData, isLoading: isLoadingUser } = api.user.getUserDetails.useQuery();

    void saveField('progress.currentStep', '2_0');

    if (isLoadingApplication || isLoadingUser) {
        return <div>Laster inn...</div>;
    }

    if (!applicationData || !userData) {
        return <div>Feil ved innlasting av brukerdata.</div>;
    }

    const dispensasjonProps = {
        application: {
            applicationID: applicationData.applicationID,
        },
        user: {
            email: userData.email ?? '', 
            address: userData.address ?? '',
            name: userData.name ?? '',
            gnr: userData.gnr ?? 0, 
            bnr: userData.bnr ?? 0,
        }
    };  

  return (
    <div>
      <Dispensasjon {...dispensasjonProps} />
    </div>
  )
}

export default BruksendreStep2_2
