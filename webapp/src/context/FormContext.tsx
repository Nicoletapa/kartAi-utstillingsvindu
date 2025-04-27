import React, { createContext, useContext, useState } from 'react';
import { type PropertyDetails, type ApplicantDetails } from '~/utils/applicationForm';

// Define FormDataType using the imported types
export interface FormDataType {
  applicant: ApplicantDetails;
  property: PropertyDetails;
}

// Define the default form data to be reused
const defaultFormData: FormDataType = {
  applicant: { name: '', email: '', phone: '' },
  property: {
    address: '',
    property_number: '',
    usage_number: '',
    lease_number: '',
    section_number: '',
    postal_code: '',
    municipality: '', 
  }
};

// Define the context type
type FormContextType = {
  applicantFormData: FormDataType;
  updateApplicantFormData: (data: FormDataType | ((prevData: FormDataType) => FormDataType)) => void;
};

// Create context with default values from applicationForm types
const FormContext = createContext<FormContextType>({
  applicantFormData: defaultFormData,
  // Fix the empty function error by providing a no-op implementation
  updateApplicantFormData: () => { /* This is intentionally empty */ },
});

// Create provider component
export const FormProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  // Use localStorage to persist data between page refreshes
  const [applicantFormData, setApplicantFormData] = useState<FormDataType>(() => {
    // Try to load from localStorage first
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem('applicantFormData');
      if (savedData) {
        try {
          // Add proper type checking for parsed JSON
          const parsedData = JSON.parse(savedData) as FormDataType;
          return parsedData;
        } catch (e) {
          console.error('Failed to parse saved form data', e);
        }
      }
    }
    
    // Default empty state if no saved data
    return defaultFormData;
  });

  const updateApplicantFormData = (data: FormDataType | ((prevData: FormDataType) => FormDataType)) => {
    const newData = typeof data === 'function' 
      ? (data as (prevData: FormDataType) => FormDataType)(applicantFormData) 
      : data;
    
    setApplicantFormData(newData);
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('applicantFormData', JSON.stringify(newData));
    }
  };

  return (
    <FormContext.Provider value={{ applicantFormData, updateApplicantFormData }}>
      {children}
    </FormContext.Provider>
  );
};

// Create custom hook for using the context
export const useFormContext = () => useContext(FormContext);