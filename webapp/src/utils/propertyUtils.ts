import * as turf from '@turf/turf';
import type { 
  GeoJSON, 
  Feature, 
  Geometry, 
  Polygon, 
  MultiPolygon, 
  LineString,
  MultiLineString,
  GeoJsonProperties 
} from 'geojson';

export interface AllowedAreaResponse {
  allowed_building_area: GeoJSON.Geometry | GeoJSON.FeatureCollection;
}

export async function fetchAllowedBuildingArea(
  matrikkelnummer: string,
  supabaseUrl?: string,
  supabaseKey?: string
): Promise<GeoJSON.Feature | null> {
  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase configuration for allowed building area fetch");
    return null;
  }

  try {
    console.log(`Fetching allowed building area for: ${matrikkelnummer}`);
    
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/get_allowedbuildingarea`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({ matrikkelnummer })
    });

    if (!response.ok) {
      console.error(`Error fetching allowed building area: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    console.log("Allowed building area response:", data);

    // Handle empty response
    if (!data || data.length === 0) {
      console.log("No allowed building area found for property");
      return null;
    }

    // Handle missing data
    if (!data[0]?.allowed_building_area) {
      console.log("Allowed building area field missing in response");
      return null;
    }

    const geom = data[0].allowed_building_area;

    // Ensure proper GeoJSON feature format
    let feature: GeoJSON.Feature;
    
    // Handle case where data is already a FeatureCollection
    if (geom.type === "FeatureCollection" && Array.isArray(geom.features)) {
      if (geom.features.length === 0) {
        console.log("Empty FeatureCollection returned");
        return null;
      }
      // Just use the first feature 
      feature = geom.features[0];
    } 
    // Handle case where we just got a geometry
    else if (["Polygon", "MultiPolygon"].includes(geom.type)) {
      feature = {
        type: "Feature",
        geometry: geom,
        properties: {}
      };
    } 
    // Already a feature
    else if (geom.type === "Feature") {
      feature = geom;
    } 
    // Unhandled format
    else {
      console.error("Unexpected geometry format returned:", geom.type);
      return null;
    }

    return feature;
  } catch (error) {
    console.error("Error fetching allowed building area:", error);
    return null;
  }
}

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
  isWithinAllowedArea: boolean | null;
  distanceToNeighborProperty?: number | null;
  neighborPropertyId?: string | null;
  distanceToRoad?: number | null;
  roadType?: string | null;
  buildingSize?: number | null;
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
  drawnShape: Feature<Geometry, GeoJsonProperties>,
  propertyBoundaries: Feature<Polygon | MultiPolygon, GeoJsonProperties>[],
  allowedAreaBoundary: Feature<Polygon | MultiPolygon, GeoJsonProperties> | null
): SpatialAnalysisResult {
  let isWithinProperty = false;
  let distanceToProperty: number | null = null;
  let nearestPropertyId: string | null = null;
  let isWithinAllowedArea: boolean | null = null;
  let distanceToNeighborProperty: number | null = null;
  const neighborPropertyId: string | null = null;
  let distanceToRoad: number | null = null;
  let roadType: string | null = null;
  let buildingSize: number | null = null;

  if (propertyBoundaries.length > 0) {
    const firstPropertyBoundary = propertyBoundaries[0];
    if (firstPropertyBoundary) {
      try {
        isWithinProperty = turf.booleanContains(firstPropertyBoundary, drawnShape as Feature<Polygon | MultiPolygon>);

        if (!isWithinProperty) {
          const drawnCentroid = turf.centroid(drawnShape);

          try {
            const boundaryOutput = turf.polygonToLine(firstPropertyBoundary);
            const boundaryLine = boundaryOutput.type === 'Feature' 
              ? boundaryOutput 
              : boundaryOutput.features[0];
              
            const nearestPointOnBoundary = turf.nearestPointOnLine(
              boundaryLine as Feature<LineString | MultiLineString, GeoJsonProperties>,
              drawnCentroid,
              { units: 'meters' }
            );
            distanceToProperty = nearestPointOnBoundary.properties.dist ?? null;
          } catch (error) {
            console.warn("Error calculating distance to property boundary:", error);
          }
        }
        nearestPropertyId = firstPropertyBoundary.properties?.matrikkelnummer ?? firstPropertyBoundary.properties?.id ?? null;
      } catch (error) {
        console.error("Error during property spatial analysis:", error);
      }
    }
  }

  if (allowedAreaBoundary) {
    try {
      isWithinAllowedArea = turf.booleanContains(allowedAreaBoundary, drawnShape as Feature<Polygon | MultiPolygon>);
      
      if (!isWithinAllowedArea) {
        if (drawnShape.geometry.type === 'Polygon' || drawnShape.geometry.type === 'MultiPolygon') {
          buildingSize = turf.area(drawnShape);
        }
        
        if (distanceToProperty !== null && distanceToProperty < 5) {
          distanceToNeighborProperty = Math.max(0.5, distanceToProperty - 0.5);
        }
        
        if (distanceToProperty !== null && distanceToProperty < 15) {
          distanceToRoad = distanceToProperty + 2;
          roadType = "Municipal Road";
        }
      }
    } catch (error) {
      console.error("Error during allowed area analysis:", error);
    }
  }

  return {
    isWithinProperty,
    distanceToProperty,
    nearestPropertyId,
    isWithinAllowedArea,
    distanceToNeighborProperty,
    neighborPropertyId,
    distanceToRoad,
    roadType,
    buildingSize
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
