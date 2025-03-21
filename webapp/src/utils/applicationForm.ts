import { ApplicationType } from "@prisma/client";
import { z } from "zod";


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


type PropertyDetails = z.infer<typeof PropertyDetailsSchema>;
type ApplicantDetails = z.infer<typeof ApplicantDetailsSchema>;


const FormSchemaSmaProsjekter = z.object({
  title: z.string().optional(),
  fields: z.object({
    property_details: PropertyDetailsSchema,
    applicant_details: ApplicantDetailsSchema,
    application_types: z.array(z.object({
      name: z.string().optional(),
      description: z.string().optional()
    })).optional(),
    permissions: z.array(z.string()).optional(),
    requirements: z.object({
      situational_map: z.string().optional()
    }).optional(),
    distances: z.object({
      neighbor_boundary: z.string().optional(),
      road_center: z.string().optional(),
      nearest_building: z.string().optional()
    }).optional(),
    environmental_conflicts: z.object({
      near_tram_train_tracks: z.string().optional(),
      near_water_sewer_pipes: z.string().optional(),
      near_high_voltage_lines: z.string().optional(),
      near_coast_river: z.string().optional(),
      in_flood_risk_area: z.string().optional(),
      protected_species_present: z.string().optional(),
      cultural_heritage_site: z.string().optional()
    }).optional(),
    access_changes: z.object({
      new_driveway: z.string().optional(),
      road_type: z.string().optional()
    }).optional(),
    attachments: z.object({
      plans_and_drawings: z.array(z.string()).optional(),
      neighbor_notification: z.array(z.string()).optional(),
      other_attachments: z.string().optional()
    }).optional(),
  }).optional()
});


const FormSchemaBruksendring = z.object({
  title: z.string().optional(),
  fields: z.object({
    property_details: PropertyDetailsSchema,
    applicant_details: ApplicantDetailsSchema,
    form_type: z.string().optional(),
    description: z.string().optional(),
    conditions: z.array(z.string()).optional(),
    modifications: z.object({
      interior_staircase: z.enum(["Yes", "No"]).optional(),
      load_bearing_wall: z.enum(["Yes", "No"]).optional(),
      window_door_exterior: z.enum(["Yes", "No"]).optional(),
      other_physical_changes: z.enum(["Yes", "No"]).optional()
    }).optional(),
    change_description: z.string().optional(),
    dispensation: z.object({
      needs_dispensation: z.enum([
        "Yes, application is attached", 
        "Yes, permission is attached", 
        "No, I don't need it"
      ]).optional()
    }).optional(),
    distances: z.object({
      neighbor_boundary_meters: z.string().optional()
    }).optional(),
    conflicts: z.object({
      high_voltage: z.enum(["Yes", "No"]).optional(),
      flood_landslide_risk: z.enum(["Yes", "No"]).optional(),
      protected_building: z.enum(["Yes", "No"]).optional()
    }).optional(),
    access: z.object({
      new_or_changed: z.enum(["Yes", "No"]).optional(),
      road_type: z.enum(["National road", "County road", "Municipal road", "Private road"]).optional()
    }).optional(),
    attachments: z.object({
      situation_map: z.enum(["Yes", "No"]).optional(),
      floor_plan: z.enum(["Yes", "No"]).optional(),
      section_drawing: z.enum(["Yes", "No"]).optional(),
      facade_drawings: z.enum(["Yes", "No"]).optional(),
      neighbor_notification: z.object({
        notified: z.enum(["Yes", "No"]).optional(),
        comments: z.string().optional()
      }).optional(),
      dispensation_documentation: z.enum(["Yes", "No"]).optional()
    }).optional(),
   
  }).optional()
});

// Define form types
type Form = z.infer<typeof FormSchemaSmaProsjekter>;
type FormBruksendring = z.infer<typeof FormSchemaBruksendring>;




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


function createApplicationFormSmaProsjekter(title: string, user?:SimplifiedUser) {
  const applicantDetails = user ? mergeUserDataWithDefaults(user) : getDefaultApplicantDetails();
  const propertyDetails = user ? mergePropertyDataWithDefaults(user) : getDefaultPropertyDetails();

  
  return {
    title,
    fields: {
      application_types: [{ name: '', description: '' }],
      permissions: [],
      requirements: { situational_map: '' },
      property_details: propertyDetails,
      applicant_details: applicantDetails,
      municipal_plans: [],
      construction_size: { calculation_methods: [] },
      distances: {
        neighbor_boundary: '',
        road_center: '',
        nearest_building: ''
      },
      environmental_conflicts: {
        near_tram_train_tracks: '',
        near_water_sewer_pipes: '',
        near_high_voltage_lines: '',
        near_coast_river: '',
        in_flood_risk_area: '',
        protected_species_present: '',
        cultural_heritage_site: ''
      },
      access_changes: {
        new_driveway: '',
        road_type: ''
      },
      attachments: {
        plans_and_drawings: [],
        neighbor_notification: [],
        other_attachments: ''
      }
    }
  } as Form;
}



function createApplicationFormBruksendring(title: string, user?: SimplifiedUser) {
  const applicantDetails = user ? mergeUserDataWithDefaults(user) : getDefaultApplicantDetails();
  const propertyDetails = user ? mergePropertyDataWithDefaults(user) : getDefaultPropertyDetails();

  
  return {
    title,
    fields: {
      form_type: "Application for Change of Use",
      description: "This form is used to change rooms in the residence from additional parts to main parts or vice versa.",
      conditions: ["Cannot be used if the changes require a responsible applicant."],
      modifications: {
        interior_staircase: "No",
        load_bearing_wall: "No",
        window_door_exterior: "No",
        other_physical_changes: "No"
      },
      change_description: "",
      dispensation: {
        needs_dispensation: "No, I don't need it"
      },
      property_details: propertyDetails,
      applicant_details: applicantDetails,
      distances: {
        neighbor_boundary_meters: ""
      },
      conflicts: {
        high_voltage: "No",
        flood_landslide_risk: "No",
        protected_building: "No"
      },
      access: {
        new_or_changed: "No",
        road_type: "Municipal road"
      },
      attachments: {
        situation_map: "No",
        floor_plan: "No",
        section_drawing: "No",
        facade_drawings: "No",
        neighbor_notification: {
          notified: "No",
          comments: ""
        },
        dispensation_documentation: "No"
      },
      
    }
  } as FormBruksendring;
}




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



function generateFieldsFromSchema() {
  let fields: Array<{title: string; type: string; name: string}> = [];
  
  // Application Types section
  fields.push({
    title: "Type of Project",
    type: "select",
    name: "fields.application_types.0.name"
  });
  
  fields.push({
    title: "Project Description",
    type: "textarea",
    name: "fields.application_types.0.description"
  });
  
  // Permissions section
  fields.push({
    title: "Do you need permission/dispensation?",
    type: "select",
    name: "fields.permissions.0"
  });
  
  // Requirements section
  fields.push({
    title: "Situational Map",
    type: "text",
    name: "fields.requirements.situational_map"
  });
  



  
  // Applicant Details section
  fields = fields.concat(generatePropertyFields("property_details"));
  
  

  // Municipal Plans section
  fields = fields.concat(generateApplicantFields("applicant_details"));

  
  fields.push({
    title: "Municipal Plan Type",
    type: "select",
    name: "fields.municipal_plans.0"
  });
  
  // Construction Size section
  fields.push({
    title: "Calculation Method",
    type: "select",
    name: "fields.construction_size.calculation_methods.0"
  });
  
  // Distances section
  fields.push({
    title: "Distance to Neighbor Boundary (meters)",
    type: "text",
    name: "fields.distances.neighbor_boundary"
  });
  
  fields.push({
    title: "Distance to Road Center (meters)",
    type: "text",
    name: "fields.distances.road_center"
  });
  
  fields.push({
    title: "Distance to Nearest Building (meters)",
    type: "text",
    name: "fields.distances.nearest_building"
  });
  
  // Environmental Conflicts section
  fields.push({
    title: "Near Train/Tram Tracks",
    type: "radio",
    name: "fields.environmental_conflicts.near_tram_train_tracks"
  });
  
  fields.push({
    title: "Near Water/Sewer Pipes",
    type: "radio",
    name: "fields.environmental_conflicts.near_water_sewer_pipes"
  });
  
  fields.push({
    title: "Near High Voltage Lines",
    type: "radio",
    name: "fields.environmental_conflicts.near_high_voltage_lines"
  });
  
  fields.push({
    title: "Near Coast/River",
    type: "radio",
    name: "fields.environmental_conflicts.near_coast_river"
  });
  
  fields.push({
    title: "In Flood Risk Area",
    type: "radio",
    name: "fields.environmental_conflicts.in_flood_risk_area"
  });
  
  fields.push({
    title: "Protected Species Present",
    type: "radio",
    name: "fields.environmental_conflicts.protected_species_present"
  });
  
  fields.push({
    title: "Cultural Heritage Site",
    type: "radio",
    name: "fields.environmental_conflicts.cultural_heritage_site"
  });
  
  // Access Changes section
  fields.push({
    title: "New Driveway Required",
    type: "radio",
    name: "fields.access_changes.new_driveway"
  });
  
  fields.push({
    title: "Road Type",
    type: "select",
    name: "fields.access_changes.road_type"
  });
  
  // Attachments section
  fields.push({
    title: "Plans and Drawings",
    type: "select",
    name: "fields.attachments.plans_and_drawings.0"
  });
  
  fields.push({
    title: "Neighbor Notification",
    type: "select",
    name: "fields.attachments.neighbor_notification.0"
  });
  
  fields.push({
    title: "Dispensation Requests",
    type: "select",
    name: "fields.attachments.dispensation_requests.0"
  });
  
  fields.push({
    title: "Other Attachments",
    type: "text",
    name: "fields.attachments.other_attachments"
  });
  
 
  
  return fields;
}

// Generate field definitions for Bruksendring
function generateFieldsFromSchemaBruksendring() {
  let fields: Array<{title: string; type: string; name: string}> = [];
  
  // Basic information
  fields.push({
    title: "Description of Change",
    type: "textarea",
    name: "fields.change_description"
  });
  
  // Modifications checkboxes
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
  
  // Dispensation
  fields.push({
    title: "Need Dispensation",
    type: "select",
    name: "fields.dispensation.needs_dispensation"
  });

  
  // Applicant details
  fields = fields.concat(generatePropertyFields("property_details"));
  fields = fields.concat(generateApplicantFields("applicant_details"));
  

  // Distances
  
  fields.push({
    title: "Distance to Neighbor Boundary (meters)",
    type: "text",
    name: "fields.distances.neighbor_boundary_meters"
  });
  
  // Conflicts
  fields.push({
    title: "Near High Voltage Lines",
    type: "radio",
    name: "fields.conflicts.high_voltage"
  });
  
  fields.push({
    title: "In Flood/Landslide Risk Area",
    type: "radio",
    name: "fields.conflicts.flood_landslide_risk"
  });
  
  fields.push({
    title: "Protected Building",
    type: "radio",
    name: "fields.conflicts.protected_building"
  });
  
  // Access
  fields.push({
    title: "New or Changed Access",
    type: "radio",
    name: "fields.access.new_or_changed"
  });
  
  fields.push({
    title: "Road Type",
    type: "select",
    name: "fields.access.road_type"
  });
  
  // Attachments
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


function getSchemaForApplicationType(applicationType: ApplicationType, user?: SimplifiedUser) {
  switch (applicationType) {
    case ApplicationType.bruksendring:
    case ApplicationType.bruksendring_med_dispensasjon:
      return {
        schema: FormSchemaBruksendring,
        defaultValues: createApplicationFormBruksendring("Application for Change of Use", user)
      };
    
    case ApplicationType.sma_byggeprosjekter:
    case ApplicationType.sma_byggeprosjekter_med_dispensasjon:
    default:
      return {
        schema: FormSchemaSmaProsjekter,
        defaultValues: createApplicationFormSmaProsjekter("Application for Small Building Projects", user)
      };
  }
}

// Get fields for application type
function getFieldsForApplicationType(applicationType: ApplicationType) {
  switch (applicationType) {
    case ApplicationType.bruksendring:
    case ApplicationType.bruksendring_med_dispensasjon:
      return generateFieldsFromSchemaBruksendring();
    
    case ApplicationType.sma_byggeprosjekter:
    case ApplicationType.sma_byggeprosjekter_med_dispensasjon:
    default:
      return generateFieldsFromSchema();
  }
}

// Export types and functions
export { 
  FormSchemaSmaProsjekter, 
  FormSchemaBruksendring,
  type Form, 
  type FormBruksendring,
  createApplicationFormSmaProsjekter, 
  createApplicationFormBruksendring,
  generateFieldsFromSchema,
  generateFieldsFromSchemaBruksendring,
  getSchemaForApplicationType,
  getFieldsForApplicationType
};

