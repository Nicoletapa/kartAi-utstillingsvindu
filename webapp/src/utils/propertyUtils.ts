import * as turf from '@turf/turf';
import type { GeoJSON } from 'geojson'; // Make sure GeoJSON is imported


export interface AllowedAreaResponse {
  allowed_building_area: GeoJSON.Geometry | GeoJSON.FeatureCollection;
}


export async function fetchAllowedBuildingArea(
  matrikkelnummer: string,
  supabaseUrl: string | undefined,
  supabaseKey: string | undefined
): Promise<GeoJSON.Feature | null> {
  if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase URL or Key is missing.");
    return null;
  }
  if (!matrikkelnummer) {
    console.warn("Matrikkelnummer is required to fetch allowed building area.");
    return null;
  }

  console.log("Fetching allowed building area for:", matrikkelnummer);

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/get_allowedbuildingarea`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({ matrikkelnummer }) // Send as object
    });

    console.log("Allowed area fetch status:", response.status);

    if (!response.ok) {
      throw new Error(`Supabase responded with status ${response.status}`);
    }

    const data: AllowedAreaResponse[] = await response.json();
    console.log("Allowed area raw data:", data);

    if (!Array.isArray(data) || data.length === 0 || !data[0]?.allowed_building_area) {
      console.warn("⚠️ No allowed building area returned from Supabase.");
      return null;
    }

    const geom = data[0].allowed_building_area;

    // Handle FeatureCollection or simple Geometry
    if (geom.type === "FeatureCollection" && Array.isArray(geom.features) && geom.features.length > 0) {
      // Return the first feature if it's a collection
      return geom.features[0] as GeoJSON.Feature;
    } else if (geom.type !== "FeatureCollection") {
      // Wrap simple geometry in a Feature structure
      return {
        type: "Feature",
        geometry: geom,
        properties: {}
      };
    } else {
      console.warn("⚠️ Allowed building area geometry is empty or invalid.");
      return null;
    }

  } catch (error) {
    console.error("❌ Error fetching allowed building area:", error);
    return null;
  }
}


// ... existing analyzeSpatialRelationship function ...
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
          const pointCoords = turf.point(drawnShape.geometry.coordinates) ;
          
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
            const drawnShapeCenter = turf.centerOfMass(drawnShape) ;
            const propertyCenter = turf.centerOfMass(property) ;
            
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
