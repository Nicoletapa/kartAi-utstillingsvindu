import React, { useState, useEffect } from 'react';
import { api } from "~/trpc/react";
import { toast } from "react-hot-toast";
import { useSession } from "next-auth/react";
import { useFormContext } from "~/context/FormContext";
import type { FormDataType } from "~/context/FormContext";

interface StepApplicantDetailsProps {
  applicationID?: number;
  onValidityChange: (isValid: boolean) => void;
}

const Step_applicant_details: React.FC<StepApplicantDetailsProps> = ({ 
  applicationID, 
  onValidityChange
}) => {
  // Get the shared form data from context
  const { applicantFormData, updateApplicantFormData } = useFormContext();
  
  // Initialize state
  const [formData, setFormDataInternal] = useState<FormDataType>(applicantFormData);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Get user session
  const { data: session } = useSession();
  
  // Update form data handler (properly typed)
  const setFormData = (newData: FormDataType | ((prevData: FormDataType) => FormDataType)) => {
    const updatedData = typeof newData === 'function' ? newData(formData) : newData;
    setFormDataInternal(updatedData);
    updateApplicantFormData(updatedData);
  };

  // Update local state when context changes
  useEffect(() => {
    setFormDataInternal(applicantFormData);
  }, [applicantFormData]);

  // Setup TRPC queries and mutations
  const { data: application, isLoading: isLoadingApplication } = api.application.getApplication.useQuery(
    { applicationID: applicationID ?? 0 },
    { enabled: !!applicationID }
  );
  
  const { data: userDetails, isLoading: isLoadingUserDetails } = api.user.getUserDetails.useQuery(
    undefined,
    { enabled: !!session }
  );
  
  const updateApplication = api.application.updateApplication.useMutation();
  const addApplicationField = api.application.addApplicationField.useMutation();

  // Check form validity
  const checkFormValidity = (data: FormDataType = formData) => {
    const safeString = (value: string | undefined | null): string => 
      (value === undefined || value === null) ? '' : String(value).trim();
    
    const isValid = 
      !!safeString(data.applicant.name) && 
      !!safeString(data.applicant.email) &&
      !!safeString(data.property.address) &&
      !!safeString(data.property.property_number) &&
      !!safeString(data.property.usage_number);
  
    onValidityChange(isValid);
    return isValid;
  };
  
  // Load user details if no application data exists
  useEffect(() => {
    // Skip if no user details, form is dirty, or we have name/address data
    if (!userDetails || isDirty || formData.applicant.name || formData.property.address) return;
    
    const updatedFormData: FormDataType = {
      applicant: {
        name: userDetails.name ?? formData.applicant.name,
        email: userDetails.email ?? formData.applicant.email,
        phone: userDetails.phone ?? formData.applicant.phone,
      },
      property: {
        address: userDetails.address ?? formData.property.address,
        property_number: userDetails.gnr?.toString() ?? formData.property.property_number,
        usage_number: userDetails.bnr?.toString() ?? formData.property.usage_number,
        lease_number: formData.property.lease_number,
        section_number: formData.property.section_number,
        postal_code: userDetails.postalCode ?? formData.property.postal_code,
        municipality: userDetails.postalArea ?? formData.property.municipality,
      }
    };
    
    setFormData(updatedFormData);
    checkFormValidity(updatedFormData);
  }, [userDetails, isDirty]);

  // Load data from application
  useEffect(() => {
    if (!application?.application_fields || 
        formData.applicant.name || 
        formData.property.address || 
        formData.property.property_number) {
      return;
    }
    
    const fieldsMap: Record<string, string> = {};
    application.application_fields.forEach(field => {
      fieldsMap[field.fieldName] = field.fieldValue;
    });
    
    const newFormData: FormDataType = {
      applicant: {
        name: fieldsMap['applicant.name'] ?? '',
        email: fieldsMap['applicant.email'] ?? '',
        phone: fieldsMap['applicant.phone'] ?? '',
      },
      property: {
        address: fieldsMap['property.address'] ?? '',
        property_number: fieldsMap['property.property_number'] ?? '',
        usage_number: fieldsMap['property.usage_number'] ?? '',
        lease_number: fieldsMap['property.lease_number'] ?? '',
        section_number: fieldsMap['property.section_number'] ?? '',
        postal_code: fieldsMap['property.postal_code'] ?? '',
        municipality: fieldsMap['property.municipality'] ?? '',
      }
    };
    
    setFormData(newFormData);
    checkFormValidity(newFormData);
  }, [application]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, section: 'applicant' | 'property') => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [name]: value
      }
    }));
    
    setIsDirty(true);
  };

  // Auto-save changes
  useEffect(() => {
    if (!isDirty) return;
    
    const saveTimeout = setTimeout(() => {
      saveChangesToDatabase().then(() => {
        if (Math.random() < 0.2) { // 20% chance to show toast
          toast.success("Endringer lagret", {
            duration: 2000,
            position: "bottom-right"
          });
        }
      }).catch(error => {
        toast.error(`Feil ved lagring: ${error instanceof Error ? error.message : 'Ukjent feil'}`);
      });
    }, 1000);
    
    return () => clearTimeout(saveTimeout);
  }, [formData, isDirty]);
  
  // Save changes to database
  const saveChangesToDatabase = async () => {
    if (!applicationID) return false;
    
    try {
      setIsSaving(true);
      
      // Update application timestamp
      await updateApplication.mutateAsync({
        applicationID,
        updatedDate: new Date(),
      });

      // Save all fields in parallel for better performance
      const fieldPromises = [
        // Applicant fields
        addApplicationField.mutateAsync({
          applicationID,
          fieldName: 'applicant.name',
          fieldValue: formData.applicant.name ?? '',
        }),
        addApplicationField.mutateAsync({
          applicationID,
          fieldName: 'applicant.email',
          fieldValue: formData.applicant.email ?? '',
        }),
        addApplicationField.mutateAsync({
          applicationID,
          fieldName: 'applicant.phone',
          fieldValue: formData.applicant.phone ?? '',
        }),
        
        // Property fields
        addApplicationField.mutateAsync({
          applicationID,
          fieldName: 'property.address',
          fieldValue: formData.property.address ?? '',
        }),
        addApplicationField.mutateAsync({
          applicationID,
          fieldName: 'property.property_number',
          fieldValue: formData.property.property_number ?? '',
        }),
        addApplicationField.mutateAsync({
          applicationID,
          fieldName: 'property.usage_number',
          fieldValue: formData.property.usage_number ?? '',
        }),
        addApplicationField.mutateAsync({
          applicationID,
          fieldName: 'property.lease_number',
          fieldValue: formData.property.lease_number ?? '',
        }),
        addApplicationField.mutateAsync({
          applicationID,
          fieldName: 'property.section_number',
          fieldValue: formData.property.section_number ?? '',
        }),
        addApplicationField.mutateAsync({
          applicationID,
          fieldName: 'property.postal_code',
          fieldValue: formData.property.postal_code ?? '',
        }),
        addApplicationField.mutateAsync({
          applicationID,
          fieldName: 'property.municipality',
          fieldValue: formData.property.municipality ?? '',
        }),
      ];
      
      await Promise.all(fieldPromises);
      setIsDirty(false);
      return true;
    } catch (error) {
      console.error('Error saving form data:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading if fetching data
  if ((isLoadingApplication && applicationID) || isLoadingUserDetails) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3">Laster data...</span>
      </div>
    );
  }

  // Form UI remains the same
  return (
    <div className="md:px-10">
      <h1 className="text-3xl font-bold mb-8">Søker- og eiendomsopplysninger</h1>
      
      {/* Applicant Details Section */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Søkeropplysninger</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Fullt navn <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.applicant.name ?? ''}
              onChange={(e) => handleInputChange(e, 'applicant')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Ola Nordmann"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              E-post <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.applicant.email ?? ''}
              onChange={(e) => handleInputChange(e, 'applicant')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="ola.nordmann@example.com"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Telefonnummer
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.applicant.phone ?? ''}
              onChange={(e) => handleInputChange(e, 'applicant')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="99887766"
            />
          </div>
        </div>
      </div>
      
      {/* Property Details Section */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Eiendomsopplysninger</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
              Adresse <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.property.address ?? ''}
              onChange={(e) => handleInputChange(e, 'property')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Eksempelveien 1"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700">
              Postnummer
            </label>
            <input
              type="text"
              id="postal_code"
              name="postal_code"
              value={formData.property.postal_code ?? ''}
              onChange={(e) => handleInputChange(e, 'property')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="1234"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="municipality" className="block text-sm font-medium text-gray-700">
              Poststed/Kommune
            </label>
            <input
              type="text"
              id="municipality"
              name="municipality"
              value={formData.property.municipality ?? ''}
              onChange={(e) => handleInputChange(e, 'property')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Eksempelby"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="property_number" className="block text-sm font-medium text-gray-700">
              Gårdsnummer (gnr) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="property_number"
              name="property_number"
              value={formData.property.property_number ?? ''}
              onChange={(e) => handleInputChange(e, 'property')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="123"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="usage_number" className="block text-sm font-medium text-gray-700">
              Bruksnummer (bnr) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="usage_number"
              name="usage_number"
              value={formData.property.usage_number ?? ''}
              onChange={(e) => handleInputChange(e, 'property')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="45"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="lease_number" className="block text-sm font-medium text-gray-700">
              Festenummer (fnr)
            </label>
            <input
              type="text"
              id="lease_number"
              name="lease_number"
              value={formData.property.lease_number ?? ''}
              onChange={(e) => handleInputChange(e, 'property')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="0"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="section_number" className="block text-sm font-medium text-gray-700">
              Seksjonsnummer (snr)
            </label>
            <input
              type="text"
              id="section_number"
              name="section_number"
              value={formData.property.section_number ?? ''}
              onChange={(e) => handleInputChange(e, 'property')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="0"
            />
          </div>
        </div>
      </div>
      
      {/* Required fields note */}
      <div className="text-sm text-gray-600 mt-4">
        <span className="text-red-500">*</span> Påkrevde felt
      </div>
      
      {/* Subtle saving indicator */}
      {isSaving && (
        <div className="fixed bottom-4 right-4 bg-white shadow-md rounded-full p-1 z-10">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
};

export default Step_applicant_details;