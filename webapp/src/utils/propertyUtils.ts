import * as turf from '@turf/turf';

export interface PropertyData {
  geom: GeoJSON.GeoJSON;
  matrikkelnummer?: string;
}

export interface PropertyIdentifiers {
  gnr?: number;
  bnr?: number;
  fnr?: number;
  snr?: number;
}

export interface SpatialAnalysisResult {
  isWithinProperty: boolean;
  distanceToProperty: number | null;  
  nearestPropertyId: string | null;
}

/**
 * Formats a property number string from gnr/bnr/fnr/snr
 */
export const formatPropertyNumber = (
  gnr?: number, bnr?: number, fnr?: number, snr?: number
): string => {
  if (gnr === undefined || bnr === undefined) return '';
  
  let propertyString = `${gnr}/${bnr}`;
  if (fnr !== undefined) propertyString += `/${fnr}`;
  if (snr !== undefined) propertyString += `/${snr}`;
  return propertyString;
};

/**
 * Analyzes spatial relationship between a drawn shape and property boundaries
 */
export function analyzeSpatialRelationship(
  drawnShape: GeoJSON.Feature,
  propertyBoundaries: GeoJSON.Feature[]
): SpatialAnalysisResult {
  let isWithinProperty = false;
  let minDistance = Infinity;
  let nearestPropertyId: string | null = null;

  if (!propertyBoundaries.length) {
    return {
      isWithinProperty: false,
      distanceToProperty: null,
      nearestPropertyId: null,
    };
  }

  try {
    // Loop through each property boundary and check relationship
    propertyBoundaries.forEach(property => {
      // Skip invalid properties
      if (!property?.geometry) {
        console.warn('Invalid property object encountered:', property);
        return;
      }

      try {
        // For point features
        if (drawnShape.geometry.type === 'Point') {
          const pointCoords = turf.point(drawnShape.geometry.coordinates) as GeoJSON.Feature<GeoJSON.Point>;
          
          if (property.geometry.type === 'Polygon' || property.geometry.type === 'MultiPolygon') {
            const polygonFeature = property as GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>;
            const pointWithin = turf.booleanPointInPolygon(pointCoords, polygonFeature);
            
            if (pointWithin) {
              isWithinProperty = true;
              nearestPropertyId = typeof property.properties?.id === 'string' 
                ? property.properties.id 
                : String(property.properties?.id) || null;
            }
          }
        } 
        // For polygons and lines
        else if (drawnShape.geometry.type === 'Polygon' || drawnShape.geometry.type === 'MultiPolygon') {
          const drawnPolygon = drawnShape as GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>;
          
          if (property.geometry.type === 'Polygon' || property.geometry.type === 'MultiPolygon') {
            const propertyPolygon = property as GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>;
            const overlaps = turf.booleanOverlap(drawnPolygon, propertyPolygon);
            const within = turf.booleanWithin(drawnPolygon, propertyPolygon);
            
            if (overlaps || within) {
              isWithinProperty = true;
              nearestPropertyId = typeof property.properties?.id === 'string' 
                ? property.properties.id 
                : String(property.properties?.id) || null;
            }
          }
        }
        
        // Calculate distance if not within property
        if (!isWithinProperty && property.geometry) {
          try {
            const drawnShapeCenter = turf.centerOfMass(drawnShape) as GeoJSON.Feature<GeoJSON.Point>;
            const propertyCenter = turf.centerOfMass(property) as GeoJSON.Feature<GeoJSON.Point>;
            
            const distance = turf.distance(
              drawnShapeCenter,
              propertyCenter,
              { units: 'meters' }
            );
            
            if (distance < minDistance) {
              minDistance = distance;
              nearestPropertyId = typeof property.properties?.id === 'string' 
                ? property.properties.id 
                : String(property.properties?.id) || null;
            }
          } catch (e) {
            console.error('Error calculating distance:', e);
          }
        }
      } catch (e) {
        console.error('Error in spatial analysis:', e);
      }
    });
  } catch (e) {
    console.error('Error performing spatial analysis:', e);
    return {
      isWithinProperty: false,
      distanceToProperty: null,
      nearestPropertyId: null,
    };
  }

  return {
    isWithinProperty,
    distanceToProperty: isWithinProperty ? 0 : minDistance === Infinity ? null : minDistance,
    nearestPropertyId,
  };
}

/**
 * Search for property by property number
 */
export const searchProperty = async (
  propertyNumber: string,
  supabaseKey?: string
): Promise<PropertyData[] | null> => {
  try {
    if (!propertyNumber.trim()) return null;

    const response = await fetch(
      `https://dctlsklovjueodoiygak.supabase.co/rest/v1/teig_utvalg?select=geom,matrikkelnummertekst&matrikkelnummertekst=eq.${propertyNumber}`,
      {
        headers: {
          'apikey': supabaseKey ?? '',
          'Content-Type': 'application/json'
        }
      }
    );
    
    const data = await response.json() as PropertyData[];
    return data.length > 0 ? data : null;
  } catch (error) {
    console.error('Error searching for property:', error);
    return null;
  }
};
