import { api } from "~/trpc/react";
import { toast } from "react-hot-toast";
import React from 'react';
import { resolveFieldPath } from './field-mappings';
import { type RouterInputs } from '~/trpc/react';

// Define the type alias based on the imported router inputs
type ApplicationUpdateInput = RouterInputs['application']['updateApplication'];

/**
 * Service for handling common API operations related to applications
 */
export const ApplicationService = {
  /**
   * Get application data by ID
   */
  getApplication: (applicationID: number) => {
    return api.application.getApplication.useQuery(
      { applicationID },
      { 
        enabled: !isNaN(applicationID) && applicationID > 0,
        staleTime: 30000 
      }
    );
  },

  /**
   * Add a field to an application
   */
  useAddField: () => {
    const mutation = api.application.addApplicationField.useMutation({
      onError: (error) => {
        toast.error(`Error saving field: ${error.message}`);
      }
    });

    return {
      ...mutation,
      addField: async (applicationID: number, fieldName: string, fieldValue: string) => {
        try {
          await mutation.mutateAsync({
            applicationID,
            fieldName,
            fieldValue,
          });
          return true;
        } catch (error) {
          console.error(`Failed to add field ${fieldName}:`, error);
          return false;
        }
      },
      // Helper for batch adding fields
      addFields: async (applicationID: number, fields: Array<{name: string, value: string}>) => {
        try {
          await Promise.all(
            fields.map(field => 
              mutation.mutateAsync({
                applicationID,
                fieldName: field.name,
                fieldValue: field.value,
              })
            )
          );
          return true;
        } catch (error) {
          console.error("Failed to add multiple fields:", error);
          return false;
        }
      }
    };
  },

  /**
   * Update application properties
   */
  useUpdateApplication: () => {
    const mutation = api.application.updateApplication.useMutation({
      onSuccess: () => {
        toast.success("Application updated successfully");
      },
      onError: (error) => {
        toast.error(`Error updating application: ${error.message}`);
      }
    });

    return {
      ...mutation,
      
      updateApplication: async (applicationID: number, data: Omit<ApplicationUpdateInput, 'applicationID'>) => {
        try {
          await mutation.mutateAsync({
            applicationID,
            ...data,
        
            updatedDate: data.updatedDate ?? new Date()
          });
          return true;
        } catch (error) {
          console.error("Failed to update application:", error);
          return false;
        }
      }
    };
  },

  /**
   * Update application subtype
   */
  useUpdateSubtype: () => {
    const mutation = api.application.updateApplicationSubtype.useMutation({
      onSuccess: () => {
        toast.success("Application subtype updated");
      },
      onError: (error) => {
        toast.error(`Error updating subtype: ${error.message}`);
      }
    });

    return {
      ...mutation,
      updateSubtype: async (applicationID: number, subTypeId: string) => {
        try {
          await mutation.mutateAsync({
            applicationID,
            subTypeId
          });
          return true;
        } catch (error) {
          console.error("Failed to update subtype:", error);
          return false;
        }
      }
    };
  },

  /**
   * Submit application
   */
  useSubmitApplication: () => {
    const mutation = api.application.submitApplication.useMutation({
      onSuccess: () => {
        toast.success("Application submitted successfully");
      },
      onError: (error) => {
        toast.error(`Error submitting application: ${error.message}`);
      }
    });

    return mutation;
  },

  /**
 * Auto-save form data to application fields with debounce
 */
useSaveFormData: (
  applicationID: number, 
  applicationType: 'bruksendring' | 'sma-prosjekter' = 'bruksendring',
  debounceMs = 1000 
) => {
  const addField = ApplicationService.useAddField();
  const [isSaving, setIsSaving] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const saveField = React.useCallback(async (fieldName: string, fieldValue: string) => {
    if (!applicationID) return;

    const mappedFieldName = resolveFieldPath(fieldName, applicationType);

    console.log('Field mapping:', {
      original: fieldName,
      mapped: mappedFieldName
    });

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => { 
      const executeSave = async () => {
        try {
          setIsSaving(true);
          await addField.addField(applicationID, mappedFieldName, fieldValue);
          setIsSaving(false);
          
          if (Math.random() < 0.2) {
            toast.success("Changes saved", { 
              duration: 2000, 
              position: "bottom-right" 
            });
          }
        } catch (error) {
          console.error(`Failed to save field ${mappedFieldName}:`, error);
          toast.error("Error saving changes");
          setIsSaving(false);
        }
      };
      void executeSave(); 
    }, debounceMs);
  }, [applicationID, applicationType, addField, debounceMs]);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    saveField,
    isSaving
  };
}
};

/**
 * Service for handling form data
 */
export const FormService = {
  /**
   * Create form state manager with validation
   */
  useForm<T>(initialData: T, validationFn?: (data: T) => boolean) {
    const [formData, setFormData] = React.useState<T>(initialData);
    const [isValid, setIsValid] = React.useState<boolean>(false);
    const [isDirty, setIsDirty] = React.useState<boolean>(false);

    // Update form data and validate
    const updateFormData = React.useCallback((
      newData: T | ((prevData: T) => T)
    ) => {
      setFormData(prev => {
        const updated = typeof newData === 'function' 
          ? (newData as (prevData: T) => T)(prev) 
          : newData;
        
        setIsDirty(true);
        
        if (validationFn) {
          setIsValid(validationFn(updated));
        }
        
        return updated;
      });
    }, [validationFn]);

    // Handle input change events
    const handleInputChange = React.useCallback((
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
      const { name, value, type } = e.target;
      const isCheckbox = type === 'checkbox';
      const fieldValue = isCheckbox 
        ? (e.target as HTMLInputElement).checked 
        : value;

      updateFormData(prev => ({
        ...prev,
        [name]: fieldValue
      }));
    }, [updateFormData]);

    return {
      formData,
      setFormData: updateFormData,
      isValid,
      isDirty,
      setIsDirty,
      handleInputChange
    };
  }
};

