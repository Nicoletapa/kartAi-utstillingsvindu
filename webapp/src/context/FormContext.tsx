import React, { createContext, useContext, useState, useEffect } from 'react';
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

// Define the default state structure explicitly
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

// Create context with default values
const FormContext = createContext<FormContextType>({
  applicantFormData: defaultFormData,
  // eslint-disable-next-line @typescript-eslint/no-empty-function -- Default context value requires a placeholder
  updateApplicantFormData: () => {},
});

// Create provider component
export const FormProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  // Explicitly type the state with FormDataType
  const [applicantFormData, setApplicantFormData] = useState<FormDataType>(() => {
    // Try to load from localStorage first
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem('applicantFormData');
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData) as FormDataType;
          if (parsedData?.applicant && parsedData?.property) {
            return parsedData;
          } else {
             console.error('Saved form data structure is invalid.');
          }
        } catch (e) {
          console.error('Failed to parse saved form data', e);
          localStorage.removeItem('applicantFormData');
        }
      }
    }

    // Default state if no valid saved data
    return defaultFormData;
  });

  // Effect to save to localStorage whenever applicantFormData changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('applicantFormData', JSON.stringify(applicantFormData));
      } catch (error) {
        console.error('Failed to save form data to localStorage', error);
      }
    }
  }, [applicantFormData]);


  const updateApplicantFormData = (data: FormDataType | ((prevData: FormDataType) => FormDataType)) => {
    // Use the functional update form of setState to ensure correct previous state
    setApplicantFormData(prevData => {
      const newData = typeof data === 'function' ? data(prevData) : data;
      // No need to manually save here, the useEffect handles it
      return newData; 
    });
  };

  return (
    <FormContext.Provider value={{ applicantFormData, updateApplicantFormData }}>
      {children}
    </FormContext.Provider>
  );
};

// Create custom hook for using the context
export const useFormContext = (): FormContextType => useContext(FormContext);