import React, { useState, useEffect } from 'react';
import { api } from "~/trpc/react";
import { toast } from "react-hot-toast";
import { useSession } from "next-auth/react";

// Default empty structures for form data
const getDefaultApplicantDetails = () => ({
  name: '',
  email: '',
  phone: '',
});

const getDefaultPropertyDetails = () => ({
  address: '',
  property_number: '', // gnr
  usage_number: '',    // bnr
  lease_number: '',    // fnr
  section_number: '',  // snr
  postal_code: '',     // postal code
  municipality: '',    // postal area/municipality
});

interface StepApplicantDetailsProps {
  applicationID?: number;
  onValidityChange: (isValid: boolean) => void;
}

const Step_applicant_details: React.FC<StepApplicantDetailsProps> = ({ 
  applicationID, 
  onValidityChange 
}) => {
  // Get user session
  const { data: session } = useSession();

  // Form data state
  const [formData, setFormData] = useState({
    applicant: getDefaultApplicantDetails(),
    property: getDefaultPropertyDetails(),
  });
  
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  // Setup TRPC mutations
  const updateApplication = api.application.updateApplication.useMutation({
    onSuccess: () => console.log("Application updated successfully"),
    onError: (error) => console.error("Failed to update application:", error)
  });
  
  const addApplicationField = api.application.addApplicationField.useMutation({
    onSuccess: (data) => console.log("Field saved successfully:", data.fieldName),
    onError: (error) => console.error("Failed to save field:", error)
  });

  // Fetch application data
  const { data: application, isLoading: isLoadingApplication } = api.application.getApplication.useQuery(
    { applicationID: applicationID ?? 0 },
    { enabled: !!applicationID }
  );
  
  // Fetch user details from the database
  const { data: userDetails, isLoading: isLoadingUserDetails } = api.user.getUserDetails.useQuery(
    undefined,
    { enabled: !!session }
  );
  
  // Load user details if available
  useEffect(() => {
    if (!userDetails || isDirty || hasSaved) return;
    
    console.log("Loading user details:", userDetails);
    
    // Only prefill if we don't have values from the application
    if (formData.applicant.name || formData.property.address) return;
    
    setFormData(prev => ({
      ...prev,
      applicant: {
        name: userDetails.name ,
        email: userDetails.email || prev.applicant.email,
        phone: userDetails.phone || prev.applicant.phone,
      },
      property: {
        address: userDetails.address || prev.property.address,
        property_number: userDetails.gnr || prev.property.property_number,
        usage_number: userDetails.bnr || prev.property.usage_number,
        lease_number: prev.property.lease_number, // Not in user details
        section_number: prev.property.section_number, // Not in user details
        postal_code: userDetails.postalCode || prev.property.postal_code,
        municipality: userDetails.postalArea || prev.property.municipality,
      }
    }));
    
    // Check form validity with the updated user data
    const updatedData = {
      applicant: {
        name: userDetails.name || formData.applicant.name,
        email: userDetails.email || formData.applicant.email,
        phone: userDetails.phone || formData.applicant.phone,
      },
      property: {
        address: userDetails.address || formData.property.address,
        property_number: userDetails.gnr || formData.property.property_number,
        usage_number: userDetails.bnr || formData.property.usage_number,
        lease_number: formData.property.lease_number,
        section_number: formData.property.section_number,
        postal_code: userDetails.postalCode || formData.property.postal_code,
        municipality: userDetails.postalArea || formData.property.municipality,
      }
    };
    
    checkFormValidity(updatedData);
  }, [userDetails, isDirty, hasSaved]);
  
  // Load data from application
  useEffect(() => {
    if (!application || !application.application_fields) return;
    
    console.log("Loading application data in Step_applicant_details");
    
    // Create a map of field names to values
    const fieldsMap: Record<string, string> = {};
    application.application_fields.forEach(field => {
        fieldsMap[field.fieldName] = field.fieldValue;
    });
    
    // Update applicant data
    const applicantData = {
      name: fieldsMap['applicant.name'] || '',
      email: fieldsMap['applicant.email'] || '',
      phone: fieldsMap['applicant.phone'] || '',
    };
    
    // Update property data
    const propertyData = {
      address: fieldsMap['property.address'] || '',
      property_number: fieldsMap['property.property_number'] || '',
      usage_number: fieldsMap['property.usage_number'] || '',
      lease_number: fieldsMap['property.lease_number'] || '',
      section_number: fieldsMap['property.section_number'] || '',
      postal_code: fieldsMap['property.postal_code'] || '',
      municipality: fieldsMap['property.municipality'] || '',
    };
    
    setFormData({
      applicant: applicantData,
      property: propertyData
    });
    
    // Check validity
    checkFormValidity({
      applicant: applicantData,
      property: propertyData
    });
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
    
    // Check validity with updated data
    const updatedData = {
      ...formData,
      [section]: {
        ...formData[section],
        [name]: value
      }
    };
    
    checkFormValidity(updatedData);
  };

  // Check form validity
  const checkFormValidity = (data = formData) => {
    // Minimum required fields for validity
    const safeString = (value: any): string => {
        if (value === undefined || value === null) return '';
        return String(value).trim();
      };
    
    const isValid = 
    !!safeString(data.applicant.name) && 
    !!safeString(data.applicant.email) &&
    !!safeString(data.property.address) &&
    !!safeString(data.property.property_number) &&
    !!safeString(data.property.usage_number);
  
    
    onValidityChange(isValid);
    return isValid;
  };

  // Auto-save changes when fields are modified
  useEffect(() => {
    // Skip initial render
    if (!isDirty) return;
    
    const saveTimeout = setTimeout(() => {
      saveChangesToDatabase()
        .then(() => {
          setHasSaved(true);
          // Show toast only occasionally
          if (Math.random() < 0.2) { // 20% chance
            toast.success("Endringer lagret", {
              duration: 2000,
              position: "bottom-right"
            });
          }
        })
        .catch((error) => {
          // Always show errors
          toast.error(`Feil ved lagring: ${error.message}`, {
            duration: 3000,
            position: "bottom-right"
          });
        });
    }, 1000); // Wait 1 second after typing stops
    
    return () => clearTimeout(saveTimeout);
  }, [formData, isDirty]);
  
  // Save changes to database
  const saveChangesToDatabase = async () => {
    if (!applicationID) return false;
    
    try {
      setIsSaving(true);
      
      // Update the application's updatedDate
      await updateApplication.mutateAsync({
        applicationID,
        updatedDate: new Date(),
      });

      // Helper function to save a field
      const saveField = async (name: string, value: string) => {
        await addApplicationField.mutateAsync({
          applicationID,
          fieldName: name,
          fieldValue: value,
        });
      };

      // Save applicant fields
      await saveField('applicant.name', formData.applicant.name || '');
      await saveField('applicant.email', formData.applicant.email || '');
      await saveField('applicant.phone', formData.applicant.phone || '');
      
      // Save property fields
      await saveField('property.address', formData.property.address || '');
      await saveField('property.property_number', formData.property.property_number || '');
      await saveField('property.usage_number', formData.property.usage_number || '');
      await saveField('property.lease_number', formData.property.lease_number || '');
      await saveField('property.section_number', formData.property.section_number || '');
      await saveField('property.postal_code', formData.property.postal_code || '');
      await saveField('property.municipality', formData.property.municipality || '');
      
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
              value={formData.applicant.name || ''}
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
              value={formData.applicant.email || ''}
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
              value={formData.applicant.phone || ''}
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
              value={formData.property.address || ''}
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
              value={formData.property.postal_code || ''}
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
              value={formData.property.municipality || ''}
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
              value={formData.property.property_number || ''}
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
              value={formData.property.usage_number || ''}
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
              value={formData.property.lease_number || ''}
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
              value={formData.property.section_number || ''}
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