/**
 * This file is used in Utstillingsvindu 2.0
 * 
 * @description
 * Provides a React Context for managing and persisting applicant and property form data
 * in a building application work flow. The form  data is persisted to localStorage,
 * allowing it to persist across page reloads.
 * 
 * @features
 * - Maintans form state for applicant and property details
 * - Persists daat to localStorage on updates
 * - Initializes from localStorage if available
 * - Offers a context hook `ukeFormContext` to access the update data
 * 
 * @props (used in <FormProvider>)
 * - `children` (ReactNode): The React tree taht will have access to the form context.
 * 
 * @note
 * - This context must wrap any component tree that needs to access or update applicant/property
 * - Handles errors when reading from or writing to localStorage
 * - Returns default empty values if localStorage is not set or data in invalid
 * 
 * @usage
 * ```tsx
 * import { FormProvider, useFormContext } from './FormContext';
 * 
 * const App = () => {
 * <FormProvider>
 *    <YourComponent />
 * </FormProvider>
 * }
*/

import React, { createContext, useContext, useState, useEffect } from 'react';
import { type PropertyDetails, type ApplicantDetails } from '~/utils/userPropertyTypes';

export interface FormDataType {
  applicant: ApplicantDetails;
  property: PropertyDetails;
}

type FormContextType = {
  applicantFormData: FormDataType;
  updateApplicantFormData: (data: FormDataType | ((prevData: FormDataType) => FormDataType)) => void;
};

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

const FormContext = createContext<FormContextType>({
  applicantFormData: defaultFormData,
  updateApplicantFormData: () => {
    throw new Error('updateApplicantFormData must be used within a FormProvider');
  },
});

export const FormProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [applicantFormData, setApplicantFormData] = useState<FormDataType>(() => {
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

    return defaultFormData;
  });

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
    setApplicantFormData(data);
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

export const useFormContext = (): FormContextType => useContext(FormContext);