import React from 'react';
import Dispensasjon from '../Dispensasjon';
import { api } from '~/trpc/react';

interface ProcessStep2_2Props {
  applicationID: number;
}

const ProcessStep2_2: React.FC<ProcessStep2_2Props> = ({ applicationID }) => {
   

    const { data: applicationData, isLoading: isLoadingApplication } = api.application.getApplication.useQuery(
        { applicationID },
        { enabled: !isNaN(applicationID) }
    );

    const { data: userData, isLoading: isLoadingUser } = api.user.getUserDetails.useQuery();



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

export default ProcessStep2_2
