/**
 * Small Projects (Små Prosjekter) form field types
 */
export interface SmaProsjekterFormData {
  // Building measurements
  size: string;
  mønehøyde: string;
  gesimshøyde: string;
  distance_road: string;

  // Distance measurements
  neighbor_boundary: string;
  nearest_building: string;
  road_center: string;

  // Environmental conflicts
  distance_train_tracks: string;
  distance_water_sewer_pipes: string;
  distance_high_voltage_lines: string;
  in_flood_risk_area: string;
  near_beach_or_river: string; // New field
  protected_species_present: string;
  cultural_heritage_site: string;

  // Calculation method
  calculation_method: string[];

  // Driveway/access related
  new_driveway: string;
  road_type: string;

  // Plan compliance
  planCompliance: string;
  nonComplianceReason: string;

  // Building density
  allowed_utilization: string;
  property_net_area: string;
  current_area: string;
  future_area: string;
  utilization_after_project: string;
}

/**
 * Bruksendring form field types
 */
export interface BruksendringFormData {
  // Distance fields
  neighboringBorder: string;
  powerLine: string;
  dangerZone: string;
  protectedBuilding: string;
  takvinkel: string;

  // Access fields
  drivewayChanges: string;
  road_type: string;

  // Description fields
  changeDescription: string;
}

// Default values for form initialization
export const smaProsjekterDefaultValues: SmaProsjekterFormData = {
  size: "",
  mønehøyde: "",
  gesimshøyde: "",
  distance_road: "",
  road_center: "",
  neighbor_boundary: "",
  nearest_building: "",
  distance_train_tracks: "",
  distance_water_sewer_pipes: "",
  distance_high_voltage_lines: "",
  in_flood_risk_area: "",
  near_beach_or_river: "",
  protected_species_present: "",
  cultural_heritage_site: "",
  calculation_method: [],
  new_driveway: "",
  road_type: "",
  planCompliance: "",
  nonComplianceReason: "",
  allowed_utilization: "",
  property_net_area: "",
  current_area: "",
  future_area: "",
  utilization_after_project: "",
};

export const bruksendringDefaultValues: BruksendringFormData = {
  neighboringBorder: "",
  powerLine: "",
  dangerZone: "",
  protectedBuilding: "",
  takvinkel: "",
  drivewayChanges: "",
  road_type: "",
  changeDescription: "",
};
export const yesNoOptions = [
  { value: "Ja", label: "Ja" },
  { value: "Nei", label: "Nei" },
];

export const drivewayOptions = [
  { value: "riksvei_eller_fylkesvei", label: "Riksvei eller fylkesvei" },
  { value: "kommunal_vei", label: "Kommunal vei" },
  { value: "privat_vei", label: "Privat vei" },
];
