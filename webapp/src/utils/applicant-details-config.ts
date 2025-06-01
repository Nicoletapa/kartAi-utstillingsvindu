import type { FormDataType } from "~/context/FormContext";
import type {
  ApplicantDetails,
  PropertyDetails,
} from "~/utils/userPropertyTypes"; // Import Zod types

// Define the interface for field display (remains the same)
export interface FieldDisplay {
  label: string;
  value: string;
}

export interface UserDetails {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  gnr: number | null;
  bnr: number | null;
  postalCode: string | null;
  postalArea: string | null;
}

// Interface for the property object used in the selector.
// This needs defined strings for display.
export interface CurrentPropertyOption {
  id: string;
  address: string;
  property_number: string;
  usage_number: string;
}

// Function to get personal data fields
export const getPersonalDataFields = (
  formData: FormDataType,
): FieldDisplay[] => [
  { label: "Navn:", value: formData.applicant.name ?? "Ikke angitt" },
  { label: "E-post:", value: formData.applicant.email ?? "Ikke angitt" },
  { label: "Telefon:", value: formData.applicant.phone ?? "Ikke angitt" },
];

// Function to get property data fields
export const getPropertyDataFields = (
  formData: FormDataType,
): FieldDisplay[] => [
  { label: "Adresse:", value: formData.property.address ?? "Ikke angitt" },
  {
    label: "Gårdsnr.:",
    value: formData.property.property_number ?? "Ikke angitt",
  },
  {
    label: "Bruksnr.:",
    value: formData.property.usage_number ?? "Ikke angitt",
  },
  {
    label: "Festenr.:",
    value: formData.property.lease_number ?? "Ikke angitt",
  },
  {
    label: "Seksjonsnr.:",
    value: formData.property.section_number ?? "Ikke angitt",
  },
];

// Function to get owner data fields (remains the same)
export const getOwnerDataFields = (
  userDetails: UserDetails | null | undefined,
): FieldDisplay[] => [
  { label: "Telefon:", value: userDetails?.phone ?? "Ikke angitt" },
  { label: "E-post:", value: userDetails?.email ?? "Ikke angitt" },
];

export const createPropertyOption = (
  propertyData: PropertyDetails,
  optionId = "current_property_for_application",
): CurrentPropertyOption | null => {
  if (
    propertyData.address &&
    propertyData.property_number &&
    propertyData.usage_number
  ) {
    return {
      id: optionId,
      address: propertyData.address,
      property_number: propertyData.property_number,
      usage_number: propertyData.usage_number,
    };
  }
  return null;
};

// Function to extract property data, returns PropertyDetails
export const extractPropertyForDisplay = (
  fieldsMap: Record<string, string | undefined>,
  userDetails: UserDetails | null | undefined,
): PropertyDetails => ({
  address: fieldsMap["property.address"] ?? userDetails?.address ?? undefined,
  property_number:
    fieldsMap["property.property_number"] ??
    userDetails?.gnr?.toString() ??
    undefined,
  usage_number:
    fieldsMap["property.usage_number"] ??
    userDetails?.bnr?.toString() ??
    undefined,
  lease_number: fieldsMap["property.lease_number"] ?? undefined,
  section_number: fieldsMap["property.section_number"] ?? undefined,
  postal_code:
    fieldsMap["property.postal_code"] ?? userDetails?.postalCode ?? undefined,
  municipality:
    fieldsMap["property.municipality"] ?? userDetails?.postalArea ?? undefined,
});

// Function to extract applicant data, returns ApplicantDetails
export const extractApplicantForDisplay = (
  fieldsMap: Record<string, string | undefined>,
  userDetails: UserDetails | null | undefined,
): ApplicantDetails => ({
  name: fieldsMap["applicant.name"] ?? userDetails?.name ?? undefined,
  email: fieldsMap["applicant.email"] ?? userDetails?.email ?? undefined,
  phone: fieldsMap["applicant.phone"] ?? userDetails?.phone ?? undefined,
});

// Combined function to extract both applicant and property data
export const extractDisplayData = (
  fieldsMap: Record<string, string | undefined>,
  userDetails: UserDetails | null | undefined,
): FormDataType => ({
  applicant: extractApplicantForDisplay(fieldsMap, userDetails),
  property: extractPropertyForDisplay(fieldsMap, userDetails),
});

// Moved checkFormValidity function - adjust based on new optional types if needed
export const checkApplicantDetailsFormValidity = (
  data: FormDataType,
): boolean => {
  // Now that fields can be undefined, ensure your validation logic is appropriate
  return (
    !!data.applicant.name &&
    !!data.applicant.email &&
    !!data.property.address &&
    !!data.property.property_number &&
    !!data.property.usage_number
  );
};

// Helper to generate fields for saving
export const getApplicantAndPropertyFieldsToSave = (
  formData: FormDataType,
): { name: string; value: string }[] => [
  // Handle potentially undefined values by defaulting to empty string for saving
  { name: "applicant.name", value: formData.applicant.name ?? "" },
  { name: "applicant.email", value: formData.applicant.email ?? "" },
  { name: "applicant.phone", value: formData.applicant.phone ?? "" },
  { name: "property.address", value: formData.property.address ?? "" },
  {
    name: "property.property_number",
    value: formData.property.property_number ?? "",
  },
  {
    name: "property.usage_number",
    value: formData.property.usage_number ?? "",
  },
  {
    name: "property.lease_number",
    value: formData.property.lease_number ?? "",
  },
  {
    name: "property.section_number",
    value: formData.property.section_number ?? "",
  },
  { name: "property.postal_code", value: formData.property.postal_code ?? "" },
  {
    name: "property.municipality",
    value: formData.property.municipality ?? "",
  },
];
