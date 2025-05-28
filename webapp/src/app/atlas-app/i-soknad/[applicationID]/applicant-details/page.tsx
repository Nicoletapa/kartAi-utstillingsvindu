"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Step_applicant_details from "~/components/StepApplicantDetails";
import { FormProvider } from "~/context/FormContext";

export default function ApplicantDetailsPage() {
  const params = useParams();
  const applicationID = parseInt(params.applicationID as string, 10);
  const [isFormValid, setIsFormValid] = useState(false);

  const handleValidityChange = (isValid: boolean) => {
    setIsFormValid(isValid);
  };

  return (
    <div className="mb-40">
      <FormProvider>
        <Step_applicant_details
          applicationID={applicationID}
          onValidityChange={handleValidityChange}
        />
      </FormProvider>
    </div>
  );
}
