"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import ProgressBarStep from '~/components/ProgressBarStep';

export default function ByggeEllerRivePage() {
  const params = useParams();
  const applicationID = parseInt(params.applicationID as string, 10);
  
  return (
    <div className="min-h-screen">
      <ProgressBarStep applicationID={applicationID} currentStep={0} />
    </div>
  );
}