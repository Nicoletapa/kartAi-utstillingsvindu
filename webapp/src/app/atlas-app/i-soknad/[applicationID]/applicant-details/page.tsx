"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Step_applicant_details from "~/components/steps/Step_applicant_details";
import { FormProvider } from "~/context/FormContext";

export default function ApplicantDetailsPage() {
  const params = useParams();
  const applicationID = parseInt(params.applicationID as string, 10);
  const [isFormValid, setIsFormValid] = useState(false);
  
  const handleValidityChange = (isValid: boolean) => {
    setIsFormValid(isValid);
  };
  
  return (
    <FormProvider>
      <Step_applicant_details 
        applicationID={applicationID} 
        onValidityChange={handleValidityChange}
      />
    </FormProvider>
  );
}