import React, { createContext, useContext, useState } from 'react';
import { type PropertyDetails, type ApplicantDetails } from '~/utils/applicationForm';

// Define FormDataType using the imported types
export interface FormDataType {
  applicant: ApplicantDetails;
  property: PropertyDetails;
}

// Define the context type
type FormContextType = {
  applicantFormData: FormDataType;
  updateApplicantFormData: (data: FormDataType | ((prevData: FormDataType) => FormDataType)) => void;
};

// Create default values that match the types exactly
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

// Create context with properly typed non-empty function
const FormContext = createContext<FormContextType>({
  applicantFormData: defaultFormData,
  // Fix: Provide a non-empty implementation
  updateApplicantFormData: () => {
    console.warn('FormContext used outside of provider');
  },
});

// Create provider component
export const FormProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  // Use localStorage to persist data between page refreshes with proper typing
  const [applicantFormData, setApplicantFormData] = useState<FormDataType>(() => {
    // Try to load from localStorage first
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem('applicantFormData');
      if (savedData) {
        try {
          // Fix: Add type validation to ensure the parsed data matches FormDataType
          const parsedData = JSON.parse(savedData) as FormDataType;
          
          // Ensure all required fields are present
          if (
            parsedData &&
            typeof parsedData === 'object' &&
            parsedData.applicant &&
            parsedData.property
          ) {
            return parsedData;
          }
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
    <FormContext.Provider value={{ 
      applicantFormData, 
      updateApplicantFormData 
    }}>
      {children}
    </FormContext.Provider>
  );
};

// Create custom hook for using the context
export const useFormContext = (): FormContextType => useContext(FormContext);