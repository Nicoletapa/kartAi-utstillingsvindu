
import { z } from "zod";

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
  neighbor_boundary: z.string().optional(),
  road_center: z.string().optional(),
  nearest_building: z.string().optional(),
  distance_train_tracks: z.string().optional(),
  distance_water_sewer_pipes: z.string().optional(),
  distance_high_voltage_lines: z.string().optional(),
  distance_va: z.string().optional(),
  mønehøyde: z.string().optional(),
  gesimshøyde: z.string().optional(),
  in_flood_risk_area: z.string().optional(),
  protected_species_present: z.string().optional(),
  cultural_heritage_site: z.string().optional()
});

const AttachmentsSchema = z.object({
  plans_and_drawings: z.array(z.string()).optional(),
  neighbor_notification: z.array(z.string()).optional(),
  dispensation_documentation: z.string().optional(),
  other_attachments: z.string().optional()
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
  new_driveway: z.string().optional(),
  road_type: z.string().optional()
});

const DistancesBruksEndringSchema = z.object({
  neighbor_boundary_meters: z.string().optional(),
  mønehøyde: z.string().optional(),
  gesimshøyde: z.string().optional(),
  takvinkel: z.string().optional(),
  high_voltage: z.enum(["Yes", "No"]).optional(),
  flood_landslide_risk: z.enum(["Yes", "No"]).optional(),
  protected_building: z.enum(["Yes", "No"]).optional()
}).optional();

// Define a separate attachments schema for Bruksendring application
const BruksendringAttachmentsSchema = z.object({
  situation_map: z.string().optional(),
  floor_plan: z.string().optional(),
  section_drawing: z.string().optional(),
  facade_drawings: z.string().optional(),
  neighbor_notification: z.object({
    notified: z.string().optional(),
    comments: z.string().optional()
  }).optional(),
  dispensation_documentation: z.string().optional()
});

type BruksendringAttachmentsDetails = z.infer<typeof BruksendringAttachmentsSchema>;
type DistancesBruksEndringDetails = z.infer<typeof DistancesBruksEndringSchema>;

type PropertyDetails = z.infer<typeof PropertyDetailsSchema>;
type ApplicantDetails = z.infer<typeof ApplicantDetailsSchema>;
type DistancesDetails  = z.infer<typeof DistancesSmaProsjekterSchema>;
type AttachmentsDetails = z.infer<typeof AttachmentsSchema>;
type RequirementsDetails = z.infer<typeof RequirementsSchema>;
type PermissionsDetails = z.infer<typeof Permissions>;
type AccessChangesDetails = z.infer<typeof AccessChanges>;

const FormSchemaSmaProsjekter = z.object({
  title: z.string().optional(),
  fields: z.object({
    property_details: PropertyDetailsSchema,
    applicant_details: ApplicantDetailsSchema,
    description: z.string().optional(),
    area_purpose: z.string().optional(),
    distances: DistancesSmaProsjekterSchema,
    requirements: RequirementsSchema,
    permissions: z.array(Permissions).optional(),
    access_changes: AccessChanges,
    attachments: AttachmentsSchema,
  }).optional()
});

const FormSchemaBruksendring = z.object({
  title: z.string().optional(),
  fields: z.object({
    property_details: PropertyDetailsSchema,
    applicant_details: ApplicantDetailsSchema,
    change_description: z.string().optional(),
    dispensation: z.object({
      needs_dispensation: z.enum([
        "Yes, application is attached", 
        "Yes, permission is attached", 
        "No, I don't need it"
      ]).optional()
    }).optional(),
    modifications: z.object({
      interior_staircase: z.enum(["Yes", "No"]).optional(),
      load_bearing_wall: z.enum(["Yes", "No"]).optional(),
      window_door_exterior: z.enum(["Yes", "No"]).optional(),
      other_physical_changes: z.enum(["Yes", "No"]).optional()
    }).optional(),
    distances: DistancesBruksEndringSchema,
    access: AccessChanges,
    attachments: BruksendringAttachmentsSchema
  }).optional()
});

// Define form types
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
    neighbor_boundary: '',
    road_center: '',
    nearest_building: '',
    distance_train_tracks: '',
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

function getDefaultAttachments(): AttachmentsDetails {
  return {
    plans_and_drawings: [],
    neighbor_notification: [],
    dispensation_documentation: '',
    other_attachments: ''
  };
}
function getDefaultAccessChanges(): AccessChangesDetails {
  return {
    new_driveway: '',
    road_type: ''
  };
}

function getDefaultBruksendringAttachments(): BruksendringAttachmentsDetails {
  return {
    situation_map: "No",
    floor_plan: "No",
    section_drawing: "No",
    facade_drawings: "No",
    neighbor_notification: {
      notified: "No",
      comments: ""
    },
    dispensation_documentation: "No"
  };
}

function getDefaultDistancesBruksendring(): DistancesBruksEndringDetails {
  return {
    neighbor_boundary_meters: '',
    mønehøyde: '',
    gesimshøyde: '',
    takvinkel: '',
    high_voltage: "No",
    flood_landslide_risk: "No",
    protected_building: "No"
  };
}

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

// Updated create functions to use the base form values
function createApplicationFormSmaProsjekter(title: string, user?:SimplifiedUser) {
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
      attachments: getDefaultAttachments()
    }
  } as Form;
}

function createApplicationFormBruksendring(title: string, user?: SimplifiedUser) {
  const baseForm = getBaseFormValues(title, user);
  
  return {
    ...baseForm,
    fields: {
      ...baseForm.fields,
      change_description: '',
      dispensation: {
        needs_dispensation: "No, I don't need it"
      },
      modifications: {
        interior_staircase: "No",
        load_bearing_wall: "No",
        window_door_exterior: "No",
        other_physical_changes: "No"
      },
      distances: getDefaultDistancesBruksendring(),
      access: getDefaultAccessChanges(),
      attachments: getDefaultBruksendringAttachments()
    }
  } as FormBruksendring;
}

// =============== FIELD GENERATORS ===============
function generatePropertyFields(prefix: string): Array<{title: string; type: string; name: string}> {
  const fieldPrefix = `fields.${prefix}`;
  
  return [
    {
      title: "Address",
      type: "text",
      name: `${fieldPrefix}.address`
    },
    {
      title: "Property Number",
      type: "text",
      name: `${fieldPrefix}.property_number`
    },
    {
      title: "Usage Number",
      type: "text",
      name: `${fieldPrefix}.usage_number`
    },
    {
      title: "Postal Code and Place",
      type: "text",
      name: `${fieldPrefix}.postal_code`
    },
    {
      title: "Municipality",
      type: "text",
      name: `${fieldPrefix}.municipality`
    },
    {
      title: "Lease Number",
      type: "text",
      name: `${fieldPrefix}.lease_number`
    },
    {
      title: "Section Number",
      type: "text",
      name: `${fieldPrefix}.section_number`
    }
  ];
}

function generateApplicantFields(prefix: string): Array<{title: string; type: string; name: string}> {
  const fieldPrefix = `fields.${prefix}`;
  
  return [
    {
      title: "Full Name",
      type: "text",
      name: `${fieldPrefix}.name`
    },
    {
      title: "Phone",
      type: "tel",
      name: `${fieldPrefix}.phone`
    },
    {
      title: "Email",
      type: "email",
      name: `${fieldPrefix}.email`
    },
  ];
}

// Common base fields that appear in all form types
function getBaseFormFields(): Array<{title: string; type: string; name: string}> {
  let fields: Array<{title: string; type: string; name: string}> = [];
  
  // Property Details - common to all forms
  fields = fields.concat(generatePropertyFields("property_details"));
   
  // Applicant Details - common to all forms  
  fields = fields.concat(generateApplicantFields("applicant_details"));
  
  // Basic attachment fields - common to all forms
  fields.push({
    title: "Situation Map",
    type: "radio",
    name: "fields.attachments.situation_map"
  });
  
  return fields;
}

// Update field generators for each section
function generateDistanceFields(prefix: string): Array<{title: string; type: string; name: string}> {
  const fieldPrefix = `fields.${prefix}`;
  
  return [
    {
      title: "Distance to Neighbor Boundary (meters)",
      type: "text",
      name: `${fieldPrefix}.neighbor_boundary`
    },
    {
      title: "Distance to Road Center (meters)",
      type: "text",
      name: `${fieldPrefix}.road_center`
    },
    {
      title: "Distance to Nearest Building (meters)",
      type: "text",
      name: `${fieldPrefix}.nearest_building`
    },
    {
      title: "Distance to Train/Tram Tracks",
      type: "text",
      name: `${fieldPrefix}.distance_train_tracks`
    },
    {
      title: "Distance to Water/Sewer Pipes",
      type: "text",
      name: `${fieldPrefix}.distance_water_sewer_pipes`
    },
    {
      title: "Distance to High Voltage Lines",
      type: "text",
      name: `${fieldPrefix}.distance_high_voltage_lines`
    },
    {
      title: "Distance to VA",
      type: "text",
      name: `${fieldPrefix}.distance_va`
    },
    {
      title: "Mønehøyde",
      type: "text",
      name: `${fieldPrefix}.mønehøyde`
    },
    {
      title: "Gesimshøyde",
      type: "text",
      name: `${fieldPrefix}.gesimshøyde`
    },
    {
      title: "In Flood Risk Area",
      type: "radio",
      name: `${fieldPrefix}.in_flood_risk_area`
    },
    {
      title: "Protected Species Present",
      type: "radio",
      name: `${fieldPrefix}.protected_species_present`
    },
    {
      title: "Cultural Heritage Site",
      type: "radio",
      name: `${fieldPrefix}.cultural_heritage_site`
    }
  ];
}

function generateRequirementsFields(prefix: string): Array<{title: string; type: string; name: string}> {
  const fieldPrefix = `fields.${prefix}`;
  
  return [
    {
      title: "Situational Map",
      type: "text",
      name: `${fieldPrefix}.situational_map`
    },
    {
      title: "Tillatt grad av utnytting (%)",
      type: "text",
      name: `${fieldPrefix}.allowed_utilization`
    },
    {
      title: "Tomtens nettoareal (m²)",
      type: "text",
      name: `${fieldPrefix}.property_net_area`
    },
    {
      title: "Areal av bygninger, konstruksjoner og parkering i dag (m²)",
      type: "text",
      name: `${fieldPrefix}.current_area`
    },
    {
      title: "Areal av bygninger, konstruksjoner og parkering etterpå (m²)",
      type: "text",
      name: `${fieldPrefix}.future_area`
    },
    {
      title: "Grad av utnytting etter prosjekt (%)",
      type: "text",
      name: `${fieldPrefix}.utilization_after_project`
    }
  ];
}

function generateAccessChangesFields(prefix: string): Array<{title: string; type: string; name: string}> {
  const fieldPrefix = `fields.${prefix}`;
  
  return [
    {
      title: "New Driveway Required",
      type: "radio",
      name: `${fieldPrefix}.new_driveway`
    },
    {
      title: "Road Type",
      type: "select",
      name: `${fieldPrefix}.road_type`
    }
  ];
}

function generateAttachmentsFields(prefix: string): Array<{title: string; type: string; name: string}> {
  const fieldPrefix = `fields.${prefix}`;
  
  return [
    {
      title: "Plans and Drawings",
      type: "select",
      name: `${fieldPrefix}.plans_and_drawings.0`
    },
    {
      title: "Neighbor Notification",
      type: "select",
      name: `${fieldPrefix}.neighbor_notification.0`
    },
    {
      title: "Dispensation Documentation",
      type: "text",
      name: `${fieldPrefix}.dispensation_documentation`
    },
    {
      title: "Other Attachments",
      type: "text",
      name: `${fieldPrefix}.other_attachments`
    }
  ];
}

// Small Projects specific fields - updated to use modular field generators
function getSmallProjectsFields(): Array<{title: string; type: string; name: string}> {
  let fields: Array<{title: string; type: string; name: string}> = [];
  
  // Basic project details
  fields.push({
    title: "Project Description",
    type: "textarea",
    name: "fields.description"
  });
  
  fields.push({
    title: "Area Purpose",
    type: "select",
    name: "fields.area_purpose"
  });
  
  // Permissions section
  fields.push({
    title: "Do you need permission/dispensation?",
    type: "select",
    name: "fields.permissions.0"
  });
  
  // Add requirements section fields
  fields = fields.concat(generateRequirementsFields("requirements"));
  
  // Add distances section fields
  fields = fields.concat(generateDistanceFields("distances"));
  
  // Add access changes fields
  fields = fields.concat(generateAccessChangesFields("access_changes"));
  
  // Add attachments fields
  fields = fields.concat(generateAttachmentsFields("attachments"));
  
  return fields;
}

// Change of Use specific fields - updated to match schema
function getChangeOfUseFields(): Array<{title: string; type: string; name: string}> {
  let fields: Array<{title: string; type: string; name: string}> = [];
  
  // Basic information
  fields.push({
    title: "Description of Change",
    type: "textarea",
    name: "fields.change_description"
  });
  
  // Dispensation section
  fields.push({
    title: "Need Dispensation",
    type: "select",
    name: "fields.dispensation.needs_dispensation"
  });
  
  // Modifications section
  fields.push({
    title: "Interior Staircase",
    type: "radio",
    name: "fields.modifications.interior_staircase"
  });
  
  fields.push({
    title: "Load-bearing Wall",
    type: "radio",
    name: "fields.modifications.load_bearing_wall"
  });
  
  fields.push({
    title: "Window/Door in Exterior Wall",
    type: "radio",
    name: "fields.modifications.window_door_exterior"
  });
  
  fields.push({
    title: "Other Physical Changes",
    type: "radio",
    name: "fields.modifications.other_physical_changes"
  });
  
  // Distances for Bruksendring
  fields.push({
    title: "Distance to Neighbor Boundary (meters)",
    type: "text",
    name: "fields.distances.neighbor_boundary_meters"
  });
  
  fields.push({
    title: "Mønehøyde",
    type: "text",
    name: "fields.distances.mønehøyde"
  });
  
  fields.push({
    title: "Gesimshøyde",
    type: "text",
    name: "fields.distances.gesimshøyde"
  });
  
  fields.push({
    title: "Takvinkel",
    type: "text",
    name: "fields.distances.takvinkel"
  });
  
  fields.push({
    title: "Near High Voltage Lines",
    type: "radio",
    name: "fields.distances.high_voltage"
  });
  
  fields.push({
    title: "In Flood/Landslide Risk Area",
    type: "radio",
    name: "fields.distances.flood_landslide_risk"
  });
  
  fields.push({
    title: "Protected Building",
    type: "radio",
    name: "fields.distances.protected_building"
  });
  
  // Access section - reuse the same field generator with a different prefix
  fields = fields.concat(generateAccessChangesFields("access"));
  
  // Attachments specific to change of use
  fields.push({
    title: "Situation Map",
    type: "radio",
    name: "fields.attachments.situation_map"
  });
  
  fields.push({
    title: "Floor Plan",
    type: "radio",
    name: "fields.attachments.floor_plan"
  });
  
  fields.push({
    title: "Section Drawing",
    type: "radio",
    name: "fields.attachments.section_drawing"
  });
  
  fields.push({
    title: "Facade Drawings",
    type: "radio",
    name: "fields.attachments.facade_drawings"
  });
  
  fields.push({
    title: "Neighbors Notified",
    type: "radio",
    name: "fields.attachments.neighbor_notification.notified"
  });
  
  fields.push({
    title: "Comments from Neighbors",
    type: "textarea",
    name: "fields.attachments.neighbor_notification.comments"
  });
  
  fields.push({
    title: "Dispensation Documentation",
    type: "radio",
    name: "fields.attachments.dispensation_documentation"
  });
  
  return fields;
}

// Generate fields using the improved modular approach
function generateFieldsFromSchema() {
  return [...getBaseFormFields(), ...getSmallProjectsFields()];
}

function generateFieldsFromSchemaBruksendring() {
  return [...getBaseFormFields(), ...getChangeOfUseFields()];
}






// Export types and functions
export { 
  FormSchemaSmaProsjekter, 
  FormSchemaBruksendring,
  type Form, 
  type FormBruksendring,
  type SimplifiedUser,
  type DistancesDetails,
  createApplicationFormSmaProsjekter, 
  createApplicationFormBruksendring,
  generateFieldsFromSchema,
  generateFieldsFromSchemaBruksendring,
  getDefaultDistancesSmaProsjekter
};
