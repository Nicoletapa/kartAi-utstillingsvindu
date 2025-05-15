import React from 'react';
import Soknaden from '../Soknaden';
import { ApplicationService } from '~/utils/api-service';
import { api } from '~/trpc/react';

interface BruksendreStep4_1Props {
  applicationID: number;
}

const BruksendreStep4_1: React.FC<BruksendreStep4_1Props> = ({ applicationID }) => {
  const { saveField } = ApplicationService.useSaveFormData(applicationID, 'sma-prosjekter');

  const { data: applicationData, isLoading: isLoadingApplication } = api.application.getApplication.useQuery(
    { applicationID },
    { enabled: !isNaN(applicationID) }
  );

  const { data: userData, isLoading: isLoadingUser } = api.user.getUserDetails.useQuery();

  const { data: userDocumentsData, isLoading: isLoadingDocuments } = api.userDocuments.getUserDocuments.useQuery(
    { applicationID },
    { enabled: !isNaN(applicationID) }
  );

  void saveField('progress.currentStep', '4_1');

  if (isLoadingApplication || isLoadingUser || isLoadingDocuments) {
    return <div>Laster inn...</div>;
  }

  if (!applicationData || !userData || !userDocumentsData) {
    return <div>Feil ved innlasting av brukerdata.</div>;
  }

  const soknadenProps = {
    application: {
      applicationID: applicationData.applicationID,
      applicationType: String(applicationData.applicationType ?? 'Ikke spesifisert'),
    },
    user: {
      email: userData.email ?? '',
      address: userData.address ?? '',
      name: userData.name ?? '',
      gnr: userData.gnr ?? 0,
      bnr: userData.bnr ?? 0,
      postalCode: userData.postalCode ?? '',
      postalArea: userData.postalArea ?? '',
    },
    userDocuments: userDocumentsData
      .filter(doc => doc.applicationID !== null) 
      .map(doc => ({
        documentID: doc.documentID,
        fileName: doc.fileName ?? 'Ukjent filnavn',
        documentType: doc.document ?? 'Ukjent type',
        applicationID: doc.applicationID! ,
    }))
  };

  return (
    <div>
      <Soknaden {...soknadenProps} />
    </div>
  );
}

export default BruksendreStep4_1;
