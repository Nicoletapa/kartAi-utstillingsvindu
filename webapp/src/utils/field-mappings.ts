import type { SmaProsjekterFormData, BruksendringFormData } from '../types/formTypes';

/**
 * Centralized field name mappings for the application
 * Maps component field names to database field paths
 */

export type FieldNameMap<T> = {
  [K in keyof T]?: string;
};

// Bruksendring field mappings
export const BruksendringFieldMappings: FieldNameMap<BruksendringFormData> = {
  neighboringBorder: 'neighbor_boundary_meters',
  powerLine: 'high_voltage',
  dangerZone: 'flood_landslide_risk',
  protectedBuilding: 'protected_building',
  takvinkel: 'takvinkel',
  drivewayChanges: 'new_driveway',
  road_type: 'road_type',
  changeDescription: 'change_description',
};

// Sma-prosjekter field mappings
export const SmaProsjekterFieldMappings: FieldNameMap<SmaProsjekterFormData> = {
  size: 'fields.distances.size',
  mønehøyde: 'fields.distances.mønehøyde',
  gesimshøyde: 'fields.distances.gesimshøyde',
  road_center: 'fields.distances.road_center',
  neighbor_boundary: 'fields.distances.neighbor_boundary',
  nearest_building: 'fields.distances.nearest_building',
  distance_train_tracks: 'fields.conflicts.train_tram_tracks',
  distance_water_sewer_pipes: 'fields.conflicts.water_sewer_pipes',
  distance_high_voltage_lines: 'fields.conflicts.high_voltage_lines',
  in_flood_risk_area: 'fields.conflicts.flood_risk_area',
  near_beach_or_river: 'fields.conflicts.near_water', 
  protected_species_present: 'fields.conflicts.protected_species',
  cultural_heritage_site: 'fields.conflicts.cultural_heritage',
  calculation_method: 'fields.distances.calculation_method',
  new_driveway: 'fields.access_changes.new_driveway',
  road_type: 'fields.access_changes.road_type',
  allowed_utilization: 'fields.requirements.allowed_utilization',
  property_net_area: 'fields.requirements.property_net_area',
  current_area: 'fields.requirements.current_area',
  future_area: 'fields.requirements.future_area',
  utilization_after_project: 'fields.requirements.utilization_after_project'
};

/**
 * Helper function to get the complete field mappings for an application type
 */
export function getFieldMappings(applicationType: 'bruksendring' | 'sma-prosjekter') {
  // Application-specific mappings
  const specificMappings = applicationType === 'bruksendring' 
    ? BruksendringFieldMappings 
    : SmaProsjekterFieldMappings;
  
  // Merge mappings, with specific mappings taking precedence
  return {  ...specificMappings };
}

/**
 * Resolve a field name to its database path
 */
export function resolveFieldPath(
    fieldName: string, 
    applicationType: 'bruksendring' | 'sma-prosjekter' = 'bruksendring'
  ): string {
    const mappings = getFieldMappings(applicationType);
    
    const mappedField = (mappings as Record<string, string | undefined>)[fieldName];
    
    return mappedField ?? fieldName;
  }