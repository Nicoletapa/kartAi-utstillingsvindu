import React from 'react'
import Soknaden from '../Soknaden';
import { api } from '~/trpc/react';

interface Process4_1Props {
  applicationID: number;
}

const Process4_1: React.FC<Process4_1Props> = ({ applicationID }) => {
  

  const { data: applicationData, isLoading: isLoadingApplication } = api.application.getApplication.useQuery(
    { applicationID },
    { enabled: !isNaN(applicationID) }
  );

  const { data: userData, isLoading: isLoadingUser } = api.user.getUserDetails.useQuery();

  const { data: userDocumentsData, isLoading: isLoadingDocuments } = api.userDocuments.getUserDocuments.useQuery(
    { applicationID },
    { enabled: !isNaN(applicationID) }
  );


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
        applicationID: doc.applicationID!,
      }))
  };

  return (
    <div>
      <Soknaden {...soknadenProps} />
    </div>

  )
}

export default Process4_1
