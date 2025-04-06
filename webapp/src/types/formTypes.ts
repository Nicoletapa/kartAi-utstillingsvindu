
/**
 * Small Projects (Små Prosjekter) form field types
 */
export interface SmaProsjekterFormData {
  // Building measurements
  size: string;
  mønehøyde: string;
  gesimshøyde: string;
  road_center: string;
  
  // Distance measurements
  neighbor_boundary: string;
  nearest_building: string;
  
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

// Constants
export const ROAD_TYPES = {
  RIKSVEI: 'riksvei_eller_fylkesvei',
  KOMMUNAL: 'kommunal_vei',
  PRIVAT: 'privat_vei',
};

export const CALCULATION_METHODS = {
  BYA: 'Bebygd areal i m²',
  BRA: 'Bruksarea i m²',
  T_BRA: 'Tillatt bruksareal i m²',
  BYA_PERCENT: 'Bebygd areal i %',
  BRA_PERCENT: 'Bruksareal i %',
  TU_PERCENT: 'Tillatt utnyttelsesgrad i %',
  U_GRAD: '(denne betegnelsen brukes i enkelte eldre planer)',
};

// Default values for form initialization
export const smaProsjekterDefaultValues: SmaProsjekterFormData = {
  size: '',
  mønehøyde: '',
  gesimshøyde: '',
  road_center: '',
  neighbor_boundary: '',
  nearest_building: '',
  distance_train_tracks: 'Nei',
  distance_water_sewer_pipes: 'Nei',
  distance_high_voltage_lines: 'Nei',
  in_flood_risk_area: 'Nei',
  near_beach_or_river: 'Nei',
  protected_species_present: 'Nei',
  cultural_heritage_site: 'Nei',
  calculation_method: [],
  new_driveway: 'Nei',
  road_type: '',
  planCompliance: 'Ja',
  nonComplianceReason: '',
  allowed_utilization: '',
  property_net_area: '',
  current_area: '',
  future_area: '',
  utilization_after_project: ''
};

export const bruksendringDefaultValues: BruksendringFormData = {
  neighboringBorder: '',
  powerLine: 'Nei',
  dangerZone: 'Nei',
  protectedBuilding: 'Nei',
  takvinkel: '',
  drivewayChanges: 'Nei',
  road_type: '',
  changeDescription: ''
};
export const yesNoOptions = [
    { value: "Ja", label: "Ja" },
    { value: "Nei", label: "Nei" }
  ];