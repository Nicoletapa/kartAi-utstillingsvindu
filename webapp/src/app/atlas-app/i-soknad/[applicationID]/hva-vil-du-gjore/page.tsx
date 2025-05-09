"use client";

import React, { useState } from "react";
import ProjectType from "../../../../../components/ProjectType";

export default function Page() {
  const [formData, setFormData] = useState({ description: "" });
  const [isFormValid, setIsFormValid] = useState<boolean>(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  
  const handleValidityChange = (isValid: boolean) => {
    setIsFormValid(isValid);
  };
  
  const handleUpload = (files: File[]) => {
    setUploadedFiles(files);
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