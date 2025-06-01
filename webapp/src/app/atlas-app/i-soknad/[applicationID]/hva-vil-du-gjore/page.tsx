"use client";

import React, { useCallback, useState } from "react";
import ProjectType from "~/components/ProjectType";

export default function Page() {
  const [formData, setFormData] = useState({ description: "" });
  const [isFormValid, setIsFormValid] = useState<boolean>(false);

  const handleValidityChange = useCallback((isValid: boolean) => {
    setIsFormValid(isValid);
  }, []);

  return (
    <ProjectType
      formData={formData}
      setFormData={setFormData}
      onValidityChange={handleValidityChange}
    />
  );
}
