import React, { useState } from 'react';
import { Info } from 'lucide-react';
import Soknaden from '../Soknaden';
import { ApplicationService } from '~/utils/api-service';
import { api } from '~/trpc/react'; // Import api

interface BruksendreStep4_1Props {
  applicationID: number;
}

const BruksendreStep4_1: React.FC<BruksendreStep4_1Props> = ({ applicationID }) => {
  const [openModal, setOpenModal] = useState<boolean>(false);
  const { saveField } = ApplicationService.useSaveFormData(applicationID, 'sma-prosjekter');

  // Fetch application data
  const { data: applicationData, isLoading: isLoadingApplication } = api.application.getApplication.useQuery(
    { applicationID },
    { enabled: !isNaN(applicationID) }
  );

  // Fetch user data
  const { data: userData, isLoading: isLoadingUser } = api.user.getUserDetails.useQuery();

  // Fetch user documents
  const { data: userDocumentsData, isLoading: isLoadingDocuments } = api.userDocuments.getUserDocuments.useQuery(
    { applicationID },
    { enabled: !isNaN(applicationID) }
  );

  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => setOpenModal(false);

  saveField('progress.currentStep', '4_1');

  // Show loading state or handle errors if necessary
  if (isLoadingApplication || isLoadingUser || isLoadingDocuments) {
    return <div>Loading...</div>; // Or a more sophisticated loading indicator
  }

  // Ensure data is available before rendering Soknaden
  if (!applicationData || !userData || !userDocumentsData) {
    return <div>Error loading data.</div>; // Or handle the error appropriately
  }

  // Prepare props for Soknaden
  const soknadenProps = {
    application: {
      applicationID: applicationData.applicationID,
      // Ensure applicationType is a string, even if it comes as an enum
      applicationType: String(applicationData.applicationType ?? 'Ikke spesifisert'),
    },
    user: {
      email: userData.email ?? '',
      address: userData.address ?? '',
      name: userData.name ?? '',
      gnr: userData.gnr ?? 0,
      bnr: userData.bnr ?? 0,
      postalCode: userData.postalCode ?? '', // Assuming postalCode exists on userData
      postalArea: userData.postalArea ?? '', // Assuming postalArea exists on userData
    },
    // Filter out documents with null applicationID and ensure the final type matches
    userDocuments: userDocumentsData
      .filter(doc => doc.applicationID !== null) // Filter out docs with null applicationID
      .map(doc => ({
        documentID: doc.documentID,
        fileName: doc.fileName ?? 'Ukjent filnavn',
        documentType: doc.document ?? 'Ukjent type',
        // After filtering, doc.applicationID is guaranteed to be number
        applicationID: doc.applicationID as number,
    }))
  };

  return (
    <div>
      <h1 className="text-3xl font-bold justify-center flex">Søknaden
        <Info size={18} className="ml-2 hover:cursor-pointer" onClick={handleOpenModal} />
      </h1>
      {openModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" onClick={handleCloseModal}>
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full transform transition-all scale-95 opacity-0 animate-fadeIn"
            onClick={(e) => e.stopPropagation()}>
            <div className="mb-8">
              <h1 className="text-xl font-medium">Om Søknaden</h1>
              <p className="text-sm mt-2">
                Byggesøknaden har blitt generert og fylt ut basert på informasjonen du har oppgitt.
                Dobbelsjekk at all informasjon og detaljer er korrekte før du sender inn søknaden.
              </p>
            </div>

            <button className="absolute mt-4 px-4 py-2 right-3 bottom-3 bg-gray-400 text-white rounded hover:bg-gray-500 transition"
              onClick={handleCloseModal}>
              Lukk
            </button>
          </div>
        </div>
      )}

      {/* Pass the required props to Soknaden */}
      <Soknaden {...soknadenProps} />
    </div>
  );
}

export default BruksendreStep4_1;
