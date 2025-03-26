"use client"

import { useState, useEffect } from 'react';
import { ApplicationType } from '@prisma/client';
import { ApplicationTemplate } from '~/components/ApplicationTemplate';
import ProgressBarStep from '~/components/ProgressBarStep';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function NewApplicationPage() {
  const [applicationID, setApplicationID] = useState<number | undefined>();
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Handle application creation result from ApplicationTemplate
  const handleTypeSelect = (type: ApplicationType, subType: string, newApplicationID: string) => {
    // Convert to number if needed (depends on your API return type)
    const appId = typeof newApplicationID === 'string' ? parseInt(newApplicationID, 10) : newApplicationID;
    setApplicationID(appId);
  };
  
  // Check authentication
  useEffect(() => {
    if (status === 'unauthenticated') {
      toast.error('You must be logged in to create an application');
      router.push('/api/auth/signin');
    }
  }, [status, router]);
  
  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3">Loading...</span>
      </div>
    );
  }
  
  if (status === 'unauthenticated') {
    return null; // Will redirect in useEffect
  }
  
  // Show application type selection if application not yet created
  if (!applicationID) {
    return (
      <ApplicationTemplate 
        isNewApplication={true}
        onTypeSelect={handleTypeSelect}
      />
    );
  }
  
  // Otherwise show the first step of the form with the applicationID
  return <ProgressBarStep applicationID={applicationID} />;
}
