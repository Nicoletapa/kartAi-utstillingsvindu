"use client";

import { useState } from "react";
import ProjectType from "../../../../../components/ProjectType";

export default function Page() {
  const [formData, setFormData] = useState({ description: "" });
  
  const handleValidityChange = (isValid: boolean) => {
    console.log("Form validity:", isValid);
    // Handle validity if needed at page level
  };
  
  const handleUpload = (files: File[]) => {
    console.log("Files uploaded:", files);
    // Handle uploads if needed at page level
  };

  return (
    <ProjectType
      formData={formData}
      setFormData={setFormData}
      onValidityChange={handleValidityChange}
      onUpload={handleUpload}
    />
  );
}