"use client";

import React, { useState } from "react";
import ProjectType from "../../../../../components/ProjectType";

export default function Page() {
  const [formData, setFormData] = useState({ description: "" });
  
  const handleValidityChange = (isValid: boolean) => {
    console.log("Form validity:", isValid);
  };
  
  const handleUpload = (files: File[]) => {
    console.log("Files uploaded:", files);
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