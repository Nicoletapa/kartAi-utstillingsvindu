import * as turf from "@turf/turf";
import type {
  Feature,
  Geometry,
  Polygon,
  MultiPolygon,
  LineString,
  MultiLineString,
  GeoJsonProperties,
} from "geojson";

interface AllowedAreaAPIResponse {
  allowed_building_area: {
    type: string;
    features?: GeoJSON.Feature[];
    geometry?: GeoJSON.Geometry;
    coordinates?: number[][][];
    properties?: GeoJSON.GeoJsonProperties;
  };
}

export async function fetchAllowedBuildingArea(
  matrikkelnummer: string,
  supabaseUrl?: string,
  supabaseKey?: string,
): Promise<GeoJSON.Feature | null> {
  if (!supabaseUrl || !supabaseKey) {
    console.error(
      "Missing Supabase configuration for allowed building area fetch",
    );
    return null;
  }

  try {
    console.log(`Fetching allowed building area for: ${matrikkelnummer}`);

    const response = await fetch(
      `${supabaseUrl}/rest/v1/rpc/get_allowedbuildingarea_by_eiendom`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ eiendom: matrikkelnummer }),
      },
    );

    if (!response.ok) {
      console.error(
        `Error fetching allowed building area: ${response.status} ${response.statusText}`,
      );
      return null;
    }

    const data = (await response.json()) as AllowedAreaAPIResponse[];
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
      // Just use the first feature - add null check to prevent undefined assignment
      const firstFeature = geom.features[0];
      if (!firstFeature) {
        console.log("First feature is undefined");
        return null;
      }
      feature = firstFeature;
    }
    // Handle case where we just got a geometry
    else if (["Polygon", "MultiPolygon"].includes(geom.type)) {
      feature = {
        type: "Feature",
        geometry: geom as GeoJSON.Geometry,
        properties: {},
      };
    }
    // Already a feature
    else if (geom.type === "Feature") {
      feature = geom as GeoJSON.Feature;
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
  matrikkelnummertekst?: string;
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
  gnr?: number,
  bnr?: number,
  fnr?: number,
  snr?: number,
): string => {
  if (gnr === undefined || bnr === undefined) return "";

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
  allowedAreaBoundary: Feature<
    Polygon | MultiPolygon,
    GeoJsonProperties
  > | null,
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
        isWithinProperty = turf.booleanContains(
          firstPropertyBoundary,
          drawnShape as Feature<Polygon | MultiPolygon>,
        );

        if (!isWithinProperty) {
          const drawnCentroid = turf.centroid(drawnShape);

          try {
            const boundaryOutput = turf.polygonToLine(firstPropertyBoundary);
            const boundaryLine =
              boundaryOutput.type === "Feature"
                ? boundaryOutput
                : boundaryOutput.features[0];

            const nearestPointOnBoundary = turf.nearestPointOnLine(
              boundaryLine as Feature<
                LineString | MultiLineString,
                GeoJsonProperties
              >,
              drawnCentroid,
              { units: "meters" },
            );
            distanceToProperty =
              nearestPointOnBoundary.properties?.dist ?? null;
          } catch (error: unknown) {
            // Convert unknown error to string safely
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            console.warn(
              "Error calculating distance to property boundary:",
              errorMessage,
            );
          }
        }
        nearestPropertyId =
          (firstPropertyBoundary.properties?.matrikkelnummer as
            | string
            | undefined) ??
          (firstPropertyBoundary.properties?.id as string | undefined) ??
          null;
      } catch (error: unknown) {
        // Convert unknown error to string safely
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error("Error during property spatial analysis:", errorMessage);
      }
    }
  }

  if (allowedAreaBoundary) {
    try {
      isWithinAllowedArea = turf.booleanContains(
        allowedAreaBoundary,
        drawnShape as Feature<Polygon | MultiPolygon>,
      );

      if (!isWithinAllowedArea) {
        if (
          drawnShape.geometry.type === "Polygon" ||
          drawnShape.geometry.type === "MultiPolygon"
        ) {
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
    } catch (error: unknown) {
      console.error(
        "Error during allowed area analysis:",
        error instanceof Error ? error.message : String(error),
      );
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
    buildingSize,
  };
}

/**
 * Search for property by property number
 */
export const searchProperty = async (
  propertyNumber: string,
  supabaseKey?: string,
): Promise<PropertyData[] | null> => {
  try {
    if (!propertyNumber.trim()) return null;

    const response = await fetch(
      `https://dctlsklovjueodoiygak.supabase.co/rest/v1/teig_utvalg?select=geom,matrikkelnummertekst&matrikkelnummertekst=eq.${propertyNumber}`,
      {
        headers: {
          apikey: supabaseKey ?? "",
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      console.error(
        `Error searching for property: ${response.status} ${response.statusText}`,
      );
      return null;
    }

    // First get the response as unknown type to avoid direct any assignment
    const rawData: unknown = await response.json();

    // Validate that it's an array before proceeding
    if (!Array.isArray(rawData)) {
      console.error("Expected array response from property search");
      return null;
    }

    // Type guard function to validate each property item
    const isPropertyData = (item: unknown): item is PropertyData => {
      return (
        typeof item === "object" &&
        item !== null &&
        "geom" in item &&
        item.geom !== undefined
      );
    };

    // Filter and convert to typed array
    const data: PropertyData[] = rawData.filter(isPropertyData);

    return data.length > 0 ? data : null;
  } catch (error) {
    console.error("Error searching for property:", error);
    return null;
  }
};

export interface ValidatedPropertyFeatureResult {
  feature?: GeoJSON.Feature;
  error?: string;
}

export function createFeatureFromPropertyData(
  data: PropertyData[] | null,
  propertyNumberToSearch: string,
): ValidatedPropertyFeatureResult {
  if (!data?.length) {
    return {
      error: "No property found with this number or invalid property data",
    };
  }

  const geometry = data[0]?.geom as GeoJSON.Geometry | undefined;
  if (!geometry) {
    // It might be useful to log what data[0] contains if geom is missing
    // console.warn("Property data found, but geometry is missing:", data[0]);
    return { error: "Invalid geometry data for the property" };
  }

  const propertyFeature: GeoJSON.Feature = {
    type: "Feature",
    geometry: geometry,
    properties: {
      id: propertyNumberToSearch, // Use the searched number as ID
      matrikkelnummer:
        data[0]?.matrikkelnummer ?? data[0]?.matrikkelnummertekst, // Fallback if one is missing
    },
  };
  return { feature: propertyFeature };
}
