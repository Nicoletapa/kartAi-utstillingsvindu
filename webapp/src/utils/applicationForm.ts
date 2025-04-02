import { z } from "zod";

// =============== CONSTANTS ===============

const JA_NEI_ENUM = z.enum(["Ja", "Nei"]);

// Common form field definitions
const COMMON_DISTANCE_FIELDS = [
  { key: "mønehøyde", title: "Mønehøyde", type: "text" },
  { key: "gesimshøyde", title: "Gesimshøyde", type: "text" },
];

const PROPERTY_FIELDS = [
  { key: "address", title: "Address", type: "text" },
  { key: "property_number", title: "Property Number", type: "text" },
  { key: "usage_number", title: "Usage Number", type: "text" },
  { key: "postal_code", title: "Postal Code and Place", type: "text" },
  { key: "municipality", title: "Municipality", type: "text" },
  { key: "lease_number", title: "Lease Number", type: "text" },
  { key: "section_number", title: "Section Number", type: "text" }
];

const APPLICANT_FIELDS = [
  { key: "name", title: "Full Name", type: "text" },
  { key: "phone", title: "Phone", type: "tel" },
  { key: "email", title: "Email", type: "email" }
];

// =============== TYPES ===============
type SimplifiedUser = {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    id: string;
    address?: string | null;
    property_number?: string | null; // gårdsnr/gnr
    usage_number?: string | null;    // bruksnr/bnr
    lease_number?: string | null;    // festenr/fnr
    section_number?: string | null;  // seksjonsnr/snr
    postal_code?: string | null;
    municipality?: string | null;
};

// =============== SCHEMAS ===============
const PropertyDetailsSchema = z.object({
  address: z.string().optional(),
  property_number: z.string().optional(),
  usage_number: z.string().optional(),
  postal_code: z.string().optional(),
  municipality: z.string().optional(),
  lease_number: z.string().optional(),
  section_number: z.string().optional()
});

const ApplicantDetailsSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(), 
});

const DistancesSmaProsjekterSchema = z.object({
  size:z.string().optional(),
  mønehøyde: z.string().optional(),
  gesimshøyde: z.string().optional(),
  road_center: z.string().optional(),
  neighbor_boundary: z.string().optional(),
  nearest_building: z.string().optional(),
  
  calculation_method: z.string().optional(),  
  distance_va: z.string().optional(),
  distance_high_voltage_lines: z.string().optional(),

  distance_water_sewer_pipes: z.string().optional(),
  in_flood_risk_area: z.string().optional(),
  protected_species_present: z.string().optional(),
  cultural_heritage_site: z.string().optional()
});

const RequirementsSchema = z.object({
  situational_map: z.string().optional(),
  allowed_utilization: z.string().optional(),      // Tillatt grad av utnytting (%)
  property_net_area: z.string().optional(),        // Tomtens nettoareal (m²)
  current_area: z.string().optional(),             // Areal av bygninger, konstruksjoner og parkering i dag (m²)
  future_area: z.string().optional(),              // Areal av bygninger, konstruksjoner og parkering etterpå (m²)
  utilization_after_project: z.string().optional() // Grad av utnytting etter prosjekt (%)
});

const Permissions = z.enum([
  "Dispensasjon", 
  "Tillatelse",
  "Ingen av delene"
]);

const AccessChanges = z.object({
  new_driveway: JA_NEI_ENUM.optional(),
  road_type: z.enum(["riksvei_eller_fylkesvei", "kommunal_vei", "privat_vei",""]).optional(),
});

const DistancesBruksEndringSchema = z.object({
  neighbor_boundary_meters: z.string().optional(),
  takvinkel: z.string().optional(),
  high_voltage: JA_NEI_ENUM.optional(),
  flood_landslide_risk: JA_NEI_ENUM.optional(),
  protected_building: JA_NEI_ENUM.optional()
}).optional();

// Schema type inferences
type PropertyDetails = z.infer<typeof PropertyDetailsSchema>;
type ApplicantDetails = z.infer<typeof ApplicantDetailsSchema>;
type DistancesDetails = z.infer<typeof DistancesSmaProsjekterSchema>;
type RequirementsDetails = z.infer<typeof RequirementsSchema>;
type AccessChangesDetails = z.infer<typeof AccessChanges>;
type DistancesBruksEndringDetails = z.infer<typeof DistancesBruksEndringSchema>;

// =============== FORM SCHEMAS ===============
const baseSchema = z.object({
  property_details: PropertyDetailsSchema,
  applicant_details: ApplicantDetailsSchema,
});

// Helper function to create consistent form schemas
function createFormSchema(specificFields) {
  return z.object({
    title: z.string().optional(),
    fields: baseSchema.extend(specificFields).optional()
  });
}

const FormSchemaSmaProsjekter = createFormSchema({
  description: z.string().optional(),
  area_purpose: z.string().optional(),
  distances: DistancesSmaProsjekterSchema,
  requirements: RequirementsSchema,
  permissions: z.array(Permissions).optional(),
  access_changes: AccessChanges,
});

const FormSchemaBruksendring = createFormSchema({
  change_description: z.string().optional(),
  dispensation: z.object({
    needs_dispensation: z.enum([
      "Yes, application is attached", 
      "Yes, permission is attached", 
      "No, I don't need it"
    ]).optional()
  }).optional(),
  distances: DistancesBruksEndringSchema,
  access: AccessChanges,
});

// Form types
type Form = z.infer<typeof FormSchemaSmaProsjekter>;
type FormBruksendring = z.infer<typeof FormSchemaBruksendring>;

// =============== DEFAULT VALUES ===============
function getDefaultPropertyDetails(): PropertyDetails {
  return {
    address: '',
    property_number: '',
    usage_number: '',
    postal_code: '',
    municipality: '',
    lease_number: '',
    section_number: ''
  };
}

function getDefaultApplicantDetails(): ApplicantDetails {
  return {
    name: '',
    phone: '',
    email: '',
  };
}

function getDefaultDistancesSmaProsjekter(): DistancesDetails {
  return {
    size: '',
    calculation_method: '',
    neighbor_boundary: '',
    road_center: '',
    nearest_building: '',
    distance_water_sewer_pipes: '',
    distance_high_voltage_lines: '',
    distance_va: '',
    mønehøyde: '',
    gesimshøyde: '',
    in_flood_risk_area: '',
    protected_species_present: '',
    cultural_heritage_site: ''
  };
}

function getDefaultRequirements(): RequirementsDetails {
  return {
    situational_map: '',
    allowed_utilization: '',
    property_net_area: '',
    current_area: '',
    future_area: '',
    utilization_after_project: ''
  };
}

function getDefaultAccessChanges(): AccessChangesDetails {
  return {
    new_driveway: 'Nei',
    road_type: ''
  };
}

function getDefaultDistancesBruksendring(): DistancesBruksEndringDetails {
  return {
    neighbor_boundary_meters: '',
    takvinkel: '',
    high_voltage: "Nei",
    flood_landslide_risk: "Nei",
    protected_building: "Nei"
  };
}

// =============== USER DATA MERGING ===============
function mergeUserDataWithDefaults(sessionUser: SimplifiedUser): ApplicantDetails {
  const defaults = getDefaultApplicantDetails();
  
  if (!sessionUser) return defaults;
  
  return {
    name: sessionUser.name || defaults.name,
    email: sessionUser.email || defaults.email,
    phone: sessionUser.phone || defaults.phone,
  };
}

function mergePropertyDataWithDefaults(sessionUser: SimplifiedUser): PropertyDetails {
  const defaults = getDefaultPropertyDetails();
  
  if (!sessionUser) return defaults;
  
  return {
    address: sessionUser.address || defaults.address,
    property_number: sessionUser.property_number || defaults.property_number,
    usage_number: sessionUser.usage_number || defaults.usage_number,
    postal_code: sessionUser.postal_code || defaults.postal_code,
    municipality: sessionUser.municipality || defaults.municipality,
    lease_number: sessionUser.lease_number || defaults.lease_number,
    section_number: sessionUser.section_number || defaults.section_number
  };
}

// =============== FORM CREATION ===============
// Base form values that are common to all types
function getBaseFormValues(title: string, user?: SimplifiedUser) {
  const applicantDetails = user ? mergeUserDataWithDefaults(user) : getDefaultApplicantDetails();
  const propertyDetails = user ? mergePropertyDataWithDefaults(user) : getDefaultPropertyDetails();
  
  return {
    title,
    fields: {
      property_details: propertyDetails,
      applicant_details: applicantDetails,
    }
  };
}

function createApplicationFormSmaProsjekter(title: string, user?:SimplifiedUser): Form {
  const baseForm = getBaseFormValues(title, user);
  
  return {
    ...baseForm,
    fields: {
      ...baseForm.fields,
      description: '',
      area_purpose: '',
      permissions: [],
      requirements: getDefaultRequirements(),
      distances: getDefaultDistancesSmaProsjekter(),
      access_changes: getDefaultAccessChanges(),
    }
  };
}

function createApplicationFormBruksendring(title: string, user?: SimplifiedUser): FormBruksendring {
  const baseForm = getBaseFormValues(title, user);
  
  return {
    ...baseForm,
    fields: {
      ...baseForm.fields,
      change_description: '',
      dispensation: {
        needs_dispensation: "No, I don't need it"
      },
      distances: getDefaultDistancesBruksendring(),
      access: getDefaultAccessChanges(),
    }
  };
}

// =============== FIELD GENERATORS ===============
// Generic field generator
function generateFields(prefix: string, fields: Array<{key: string, title: string, type: string}>): Array<{title: string, type: string, name: string}> {
  const fieldPrefix = prefix ? `fields.${prefix}` : 'fields';
  
  return fields.map(field => ({
    title: field.title,
    type: field.type,
    name: `${fieldPrefix}.${field.key}`
  }));
}

// Common base fields that appear in all form types
function getBaseFormFields(): Array<{title: string; type: string; name: string}> {
  let fields: Array<{title: string; type: string; name: string}> = [];
  
  // Property details fields
  fields = fields.concat(generateFields("property_details", PROPERTY_FIELDS));
   
  // Applicant details fields
  fields = fields.concat(generateFields("applicant_details", APPLICANT_FIELDS));
  
  // Attachments fields
  fields = fields.concat(generateFields("attachments", [
    { key: "situation_map", title: "Situation Map", type: "radio" }
  ]));
  
  return fields;
}

// Section-specific field generators
function generateDistanceFields(prefix: string): Array<{title: string; type: string; name: string}> {
  return generateFields(prefix, [
    { key: "neighbor_boundary", title: "Distance to Neighbor Boundary (meters)", type: "text" },
    { key: "road_center", title: "Distance to Road Center (meters)", type: "text" },
    { key: "nearest_building", title: "Distance to Nearest Building (meters)", type: "text" },
    { key: "distance_train_tracks", title: "Distance to Train/Tram Tracks", type: "text" },
    { key: "distance_water_sewer_pipes", title: "Distance to Water/Sewer Pipes", type: "text" },
    { key: "distance_high_voltage_lines", title: "Distance to High Voltage Lines", type: "text" },
    { key: "distance_va", title: "Distance to VA", type: "text" },
    ...COMMON_DISTANCE_FIELDS.map(field => ({ key: field.key, title: field.title, type: field.type })),
    { key: "in_flood_risk_area", title: "In Flood Risk Area", type: "radio" },
    { key: "protected_species_present", title: "Protected Species Present", type: "radio" },
    { key: "cultural_heritage_site", title: "Cultural Heritage Site", type: "radio" }
  ]);
}

function generateRequirementsFields(prefix: string): Array<{title: string; type: string; name: string}> {
  return generateFields(prefix, [
    { key: "situational_map", title: "Situational Map", type: "text" },
    { key: "allowed_utilization", title: "Tillatt grad av utnytting (%)", type: "text" },
    { key: "property_net_area", title: "Tomtens nettoareal (m²)", type: "text" },
    { key: "current_area", title: "Areal av bygninger, konstruksjoner og parkering i dag (m²)", type: "text" },
    { key: "future_area", title: "Areal av bygninger, konstruksjoner og parkering etterpå (m²)", type: "text" },
    { key: "utilization_after_project", title: "Grad av utnytting etter prosjekt (%)", type: "text" }
  ]);
}

function generateAccessChangesFields(prefix: string): Array<{title: string; type: string; name: string}> {
  return generateFields(prefix, [
    { key: "new_driveway", title: "New Driveway Required", type: "radio" },
    { key: "road_type", title: "Road Type", type: "select" }
  ]);
}

// Form-specific field generators
function getSmallProjectsFields(): Array<{title: string; type: string; name: string}> {
  let fields: Array<{title: string; type: string; name: string}> = [];
  
  // Basic project details
  fields = fields.concat(generateFields("", [
    { key: "description", title: "Project Description", type: "textarea" },
    { key: "area_purpose", title: "Area Purpose", type: "select" }
  ]));
  
  // Permissions section
  fields = fields.concat(generateFields("permissions", [
    { key: "0", title: "Do you need permission/dispensation?", type: "select" }
  ]));
  
  // Add requirements section fields
  fields = fields.concat(generateRequirementsFields("requirements"));
  
  // Add distances section fields
  fields = fields.concat(generateDistanceFields("distances"));
  
  // Add access changes fields
  fields = fields.concat(generateAccessChangesFields("access_changes"));
  
  return fields;
}

function getChangeOfUseFields(): Array<{title: string; type: string; name: string}> {
  let fields: Array<{title: string; type: string; name: string}> = [];
  
  // Basic change description
  fields = fields.concat(generateFields("", [
    { key: "change_description", title: "Description of Change", type: "textarea" }
  ]));
  
  // Dispensation information
  fields = fields.concat(generateFields("dispensation", [
    { key: "needs_dispensation", title: "Need Dispensation", type: "select" }
  ]));
    
  // Distances fields
  fields = fields.concat(generateFields("distances", [
    { key: "neighbor_boundary_meters", title: "Distance to Neighbor Boundary (meters)", type: "text" },
    { key: "takvinkel", title: "Takvinkel", type: "text" },
    { key: "high_voltage", title: "Near High Voltage Lines", type: "radio" },
    { key: "flood_landslide_risk", title: "In Flood/Landslide Risk Area", type: "radio" },
    { key: "protected_building", title: "Protected Building", type: "radio" }
  ]));
  
  // Access changes
  fields = fields.concat(generateAccessChangesFields("access"));
  
  return fields;
}

// Public form field generation functions
function generateFieldsFromSchema() {
  return [...getBaseFormFields(), ...getSmallProjectsFields()];
}

function generateFieldsFromSchemaBruksendring() {
  return [...getBaseFormFields(), ...getChangeOfUseFields()];
}

// =============== EXPORTS ===============
export { 
  FormSchemaSmaProsjekter, 
  FormSchemaBruksendring,
  type Form, 
  type FormBruksendring,
  type SimplifiedUser,
  type DistancesDetails,
  type PropertyDetails,
  type ApplicantDetails,
  createApplicationFormSmaProsjekter, 
  createApplicationFormBruksendring,
  generateFieldsFromSchema,
  generateFieldsFromSchemaBruksendring,
  getDefaultDistancesSmaProsjekter
};
