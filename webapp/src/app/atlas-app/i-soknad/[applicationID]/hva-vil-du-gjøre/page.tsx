"use client";

import React from 'react';
import ProjectType from '~/components/ProjectType';

// Define the expected props for the page component
interface PageProps {
  params: { applicationID: string };
  // searchParams?: { [key: string]: string | string[] | undefined }; // Optional: if you need search params
}

// Accept params as a prop
export default function Page({ params }: PageProps) {
  // Use the params prop directly
  const applicationID = parseInt(params.applicationID, 10);

  // If you still need useParams for other reasons, you can keep it,
  // but ensure the function signature accepts the props.
  // const clientParams = useParams();
  // const applicationIDFromHook = parseInt(clientParams.applicationID as string, 10);

  return (
    <div className="min-h-screen">
      {/* Pass applicationID to ProjectType if needed, or manage it within ProjectType using useParams */}
      <ProjectType
        onUpload={() => {}}
        onValidityChange={(isValid) => {
          console.log("Form validity:", isValid);
        }}
      />
    </div>
  );
}