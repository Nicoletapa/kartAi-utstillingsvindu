maria
m...
Playing Google Chrome

nicoleta — 3/18/2025 1:06 PM
oki
nicoleta — 3/18/2025 1:16 PM
kan du merge søknaden også?
maria — 3/18/2025 1:16 PM
tenkte å spørre om det selv om den ikke er ferdig
tenkte å refactore noen ting men kan lage en pull request?
nicoleta — 3/18/2025 1:24 PM
er det mye å refactore?
maria — 3/18/2025 1:25 PM
nei ikke mye, bare noen ting som kunne vært egne komponenter
lagde en pull request
nicoleta — 3/18/2025 1:26 PM
ja ja tror det skal går fint, og bare fortsett med de i en ny branch
maria — 3/18/2025 1:26 PM
yee
nicoleta — 3/19/2025 1:50 PM
https://www.dibk.no/globalassets/blanketter_utfyllbare/alle-blanketter/byggesoknad-for-deg-som-onsker-a-bygge-eller-rive_versjon-1.0.5.pdf
https://www.dibk.no/globalassets/blanketter_utfyllbare/alle-blanketter/soknad-om-bruksendring_versjon-1.1.1.pdf
https://www.dibk.no/globalassets/blanketter_utfyllbare/alle-blanketter/5188-melding-om-bygning-eller-tilbygg-som-er-unntatt-soknadsplikt.pdf
maria — 3/28/2025 2:24 PM
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ArrowLeft, ArrowRight, Info, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "../../../../components/ui/button";
Expand
message.txt
15 KB
"use client"

import { useState, useEffect } from 'react';
import { ApplicationType } from '@prisma/client';
import { ApplicationTemplate } from '~/components/ApplicationTemplate';
import ProgressBarStep from '~/components/ProgressBarStep';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function NewApplicationPage() {
  const [applicationID, setApplicationID] = useState<number | undefined>();
  const { data: session, status } = useSession();
  const router = useRouter();

  // Handle application creation result from ApplicationTemplate
  const handleTypeSelect = (type: ApplicationType, subType: string, newApplicationID: string) => {
    // Convert to number if needed (depends on your API return type)
    const appId = typeof newApplicationID === 'string' ? parseInt(newApplicationID, 10) : newApplicationID;
    setApplicationID(appId);
  };

  // Check authentication
  useEffect(() => {
    if (status === 'unauthenticated') {
      toast.error('You must be logged in to create an application');
      router.push('/api/auth/signin');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3">Loading...</span>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null; // Will redirect in useEffect
  }

  // Show application type selection if application not yet created
  if (!applicationID) {
    return (
      <ApplicationTemplate 
        isNewApplication={true}
        onTypeSelect={handleTypeSelect}
      />
    );
  }

  // Otherwise show the first step of the form with the applicationID
  return <ProgressBarStep applicationID={applicationID} />;
}
maria — 5/2/2025 10:41 AM
"use client";
import { type ChangeEvent, useState, type KeyboardEvent, useEffect, useRef } from "react";
import { api } from "~/trpc/react";
import type { Map } from 'leaflet';
import type { SpatialAnalysisResult } from './TiltaksAidMap';
import { SendHorizonal } from 'lucide-react';
Expand
message.txt
20 KB
nicoleta — 5/2/2025 1:41 PM
interface CommonStepProps<TFormData = Record<string, unknown>> {
    applicationID?: number;
    formData?: TFormData; // Use the generic type TFormData
    setFormData?: React.Dispatch<React.SetStateAction<TFormData>>; // Use the generic type TFormData
    onValidityChange?: (isValid: boolean) => void;
}

// Update StepComponentsType to use the common props interface
type StepComponentsType = Record<
    number,
    // Use React.ComponentType with the common props interface
    Record<number, React.ComponentType<CommonStepProps>>
>;
maria — 5/5/2025 4:39 PM
helluu driver du å sletter pages og komponenter vi ikke trenger i front-end?
nicoleta — 5/5/2025 4:39 PM
Nope
maria — 5/5/2025 4:41 PM
okii kommer til å slette noen sider og/eller komponenter
maria — 5/6/2025 1:46 PM
bruker vi mysql?
nicoleta — 5/6/2025 1:46 PM
Ja
maria — 5/7/2025 12:55 PM
"use client";

import { useState, useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { cn } from "~/lib/utils";
Expand
message.txt
9 KB
maria — 5/7/2025 1:20 PM
Image
nicoleta — 5/7/2025 1:28 PM
Søke på matrikkelen
Har ikke sjekket om det funker siden i går
Sier fra om det funker
maria — 5/7/2025 1:48 PM
de sier at det er kanskje fordi han ene på gruppa gjør noen endringer i databasen
nicoleta — 5/7/2025 1:50 PM
Oki
nicoleta — 12:11 PM
const FASTAPI_PLANPRAT_URL = process.env.PLANPRAT_URL || "http://localhost:8000/api/planprat";
maria — 7:24 PM
kommer du tilbake etterpå?🥺  SOS
nicoleta — 7:25 PM
Maybe
Hva skjer
maria — 7:26 PM
det skjer noe funky ting på pc en til Anna, og på min så har den fått lasta de dokmentene, men chatbot respons tar evigheter
nicoleta — 7:27 PM
Interesting
Skal kanskje komme å se etterpå hvis dere er fremdeles der
Hvis ikke s kan vi ta det på discord
maria — 7:32 PM
true, men hadde tatt lengre tid hadde det ikke?
har du fått pulla fra main?
hvis ikke så kan du filme videoen
nicoleta — 7:59 PM
Litt
Ja jeg har gjort det
Jeg har ikke merget mine endringer da
maria — 8:00 PM
går det greit at du filmer da?
nicoleta — 8:00 PM
Ja
maria — 8:01 PM
oki we will make you a manus or list
nicoleta — 8:01 PM
Er dere på mc?
maria — 8:01 PM
yuh
dessverre
nicoleta — 8:01 PM
Kanskje jeg kommer nå snart
nicoleta — 8:20 PM
Kommer nå
nicoleta — 10:56 PM
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

// Define more specific types for API responses
export interface AllowedAreaResponse {
  allowed_building_area: GeoJSON.Geometry | GeoJSON.FeatureCollection;
}

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
  supabaseKey?: string
): Promise<GeoJSON.Feature | null> {
  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase configuration for allowed building area fetch");
    return null;
  }

  try {
    console.log(`Fetching allowed building area for: ${matrikkelnummer}`);
    
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/get_allowedbuildingarea_by_eiendom`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({ eiendom: matrikkelnummer })
    });

    if (!response.ok) {
      console.error(`Error fetching allowed building area: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json() as AllowedAreaAPIResponse[];
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
        properties: {}
      };
    } 
    // Already a feature
    else if (geom.type === "Feature") {
      feature = geom as GeoJSON.Feature;
... (201 lines left)
Collapse
message.txt
10 KB
NEXT_PUBLIC_SUPABASE_KEY ='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjdGxza2xvdmp1ZW9kb2l5Z2FrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjUzNTU2MTksImV4cCI6MjA0MDkzMTYxOX0.7yi8lL--MMUv2iK6A9JzGNw91oMn_seJ_9O4Ki26wik'
NEXT_PUBLIC_SUPABASE_URL = 'https://dctlsklovjueodoiygak.supabase.co/'
'use client';
import { useRef, useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useMap } from 'react-leaflet';
import * as L from 'leaflet';
import type { Map } from 'leaflet';
Expand
message.txt
16 KB
﻿
'use client';
import { useRef, useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useMap } from 'react-leaflet';
import * as L from 'leaflet';
import type { Map } from 'leaflet';
import type { Feature, Geometry, GeoJsonProperties } from 'geojson';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import { Home } from 'lucide-react';
import {
  analyzeSpatialRelationship,
  formatPropertyNumber,
  searchProperty as fetchProperty,
  fetchAllowedBuildingArea
} from '~/utils/propertyUtils';
import { usePropertySearch } from '~/hooks/usePropertySearch';
import type { SpatialAnalysisResult, PropertyData } from '~/utils/propertyUtils';

// Dynamically import Leaflet components to prevent hydration issues
const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false });
const WMSTileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.WMSTileLayer), { ssr: false });
const LayersControl = dynamic(() => import('react-leaflet').then((mod) => mod.LayersControl), { ssr: false });
const BaseLayer = dynamic(() => import('react-leaflet').then((mod) => mod.LayersControl.BaseLayer), { ssr: false });
const Overlay = dynamic(() => import('react-leaflet').then((mod) => mod.LayersControl.Overlay), { ssr: false });

// Helper functions to reduce code duplication
const getPolygonFeatures = (features: GeoJSON.Feature[]) => {
  return features.filter(feature => 
    feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon'
  ) as GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon, GeoJsonProperties>[];
};

const performSpatialAnalysis = (
  shape: GeoJSON.Feature, 
  boundaries: GeoJSON.Feature[], 
  allowedArea: GeoJSON.Feature | null
): SpatialAnalysisResult | undefined => {
  const polygonFeatures = getPolygonFeatures(boundaries);
  
  const typedAllowedArea = allowedArea as GeoJSON.Feature<
    GeoJSON.Polygon | GeoJSON.MultiPolygon, 
    GeoJsonProperties
  > | null;
  
  return analyzeSpatialRelationship(shape, polygonFeatures, typedAllowedArea);
};

interface DrawControlProps {
  map: Map;
  onShapeDrawn?: (shape: GeoJSON.Feature, spatialAnalysis?: SpatialAnalysisResult) => void;
  propertyBoundaries?: GeoJSON.Feature[];
  allowedAreaBoundary?: GeoJSON.Feature | null;
}

const drawnItemsRef = new L.FeatureGroup();

const DrawControl = ({ map, onShapeDrawn, propertyBoundaries = [], allowedAreaBoundary }: DrawControlProps) => {
  const drawControlRef = useRef<L.Control.Draw | null>(null);

  useEffect(() => {
    if (!map) return;

    if (!map.hasLayer(drawnItemsRef)) {
      map.addLayer(drawnItemsRef);
    }

    if (!drawControlRef.current) {
      drawControlRef.current = new L.Control.Draw({
        edit: {
          featureGroup: drawnItemsRef,
          remove: true
        },
        draw: {
          polygon: {
            allowIntersection: false,
            showArea: true
          },
          rectangle: {
            shapeOptions: {
              color: '#97009c'
            }
          },
          marker: {
            icon: new L.Icon.Default()
          },
          polyline: {
            shapeOptions: {
              color: '#3388ff',
              weight: 4
            }
          },
          circle: {
            shapeOptions: {
              color: '#f03',
              fillOpacity: 0.2
            }
          },
          circlemarker: false
        }
      });
      map.addControl(drawControlRef.current);
    }

    const handleDrawCreated = ((e: L.DrawEvents.Created) => {
      const layer = e.layer;
      drawnItemsRef.addLayer(layer);

      const geoJson = layer.toGeoJSON() as Feature<Geometry, GeoJsonProperties>;
      console.log('Drawn shape GeoJSON:', geoJson);

      const spatialAnalysis = performSpatialAnalysis(
        geoJson, 
        propertyBoundaries,
        allowedAreaBoundary ?? null
      );
      console.log('Spatial analysis (incl. allowed area):', spatialAnalysis);

      if (onShapeDrawn) {
        onShapeDrawn(geoJson, spatialAnalysis);
      }
    }) as L.LeafletEventHandlerFn;

    const handleDrawEdited = ((e: L.DrawEvents.Edited) => {
      const layers = e.layers;
      layers.eachLayer((layer: L.Layer) => {
        const typedLayer = layer as L.Layer & { toGeoJSON: () => GeoJSON.Feature };
        const geoJson = typedLayer.toGeoJSON();

        const spatialAnalysis = performSpatialAnalysis(
          geoJson,
          propertyBoundaries,
          allowedAreaBoundary ?? null
        );

        if (onShapeDrawn) {
          onShapeDrawn(geoJson, spatialAnalysis);
        }
      });
    }) as L.LeafletEventHandlerFn;

    map.on(L.Draw.Event.CREATED, handleDrawCreated);
    map.on(L.Draw.Event.EDITED, handleDrawEdited);

    return () => {
      map.off(L.Draw.Event.CREATED, handleDrawCreated);
      map.off(L.Draw.Event.EDITED, handleDrawEdited);
    };
  }, [map, onShapeDrawn, propertyBoundaries, allowedAreaBoundary]);

  return null;
};

interface TiltaksAidMapProps {
  onMapReady?: (map: Map) => void;
  onShapeDrawn?: (shape: GeoJSON.Feature, spatialAnalysis?: SpatialAnalysisResult) => void;
  userGnr?: number;
  userBnr?: number;
  userFnr?: number;
  userSnr?: number;
  autoZoom?: boolean;
}

const TiltaksAidMap = ({
  onMapReady,
  onShapeDrawn,
  userGnr,
  userBnr,
  userFnr,
  userSnr,
  autoZoom = true
}: TiltaksAidMapProps) => {
  const mapRef = useRef<Map | null>(null);
  const [zoom] = useState(15);
  const MAX_ZOOM = 19;
  const [propertyBoundary, setPropertyBoundary] = useState<L.GeoJSON | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [propertyBoundaries, setPropertyBoundaries] = useState<GeoJSON.Feature[]>([]);
  const [initialSearchSuccessful, setInitialSearchSuccessful] = useState(false);
  const initialSearchAttemptedRef = useRef(false);
  const [allowedAreaGeoJson, setAllowedAreaGeoJson] = useState<GeoJSON.Feature | null>(null);
  const allowedAreaLayerRef = useRef<L.GeoJSON | null>(null);
  const {
    searchInput,
    setSearchInput,
    errorMessage,
    setErrorMessage
  } = usePropertySearch();

  const mapReadyCallbackFired = useRef(false);
  const stableOnMapReady = useRef(onMapReady).current;
  const loggedPropertyData = useRef(false);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY;

  // Function to clear map layers and state
  const clearMapState = useCallback(() => {
    if (propertyBoundary && mapRef.current) {
      mapRef.current.removeLayer(propertyBoundary);
      setPropertyBoundary(null);
    }
    if (allowedAreaLayerRef.current && mapRef.current) {
      mapRef.current.removeLayer(allowedAreaLayerRef.current);
      allowedAreaLayerRef.current = null;
    }
    setPropertyBoundaries([]);
    setAllowedAreaGeoJson(null);
    setErrorMessage(null);
    setInitialSearchSuccessful(false);
    loggedPropertyData.current = false;
  }, [propertyBoundary, setErrorMessage]);

  // --- Fetch Allowed Building Area ---
  const fetchAllowedAreaForProperty = async (propertyNumber: string) => {
    if (propertyNumber) {
      try {
        const allowedArea = await fetchAllowedBuildingArea(
          propertyNumber,
          supabaseUrl,
          supabaseKey
        );
        
        if (allowedArea) {
          setAllowedAreaGeoJson(allowedArea);
        }
      } catch (error) {
        console.error("Error fetching allowed building area:", error);
      }
    }
  };

  // --- Handle property search ---
  const handlePropertySearch = useCallback(async (propertyNumberToSearch: string = searchInput) => {
    clearMapState();

    try {
      const data: PropertyData[] | null = await fetchProperty(
        propertyNumberToSearch,
        process.env.NEXT_PUBLIC_SUPABASE_KEY
      );

      if (!data || data.length === 0) {
        setErrorMessage('No property found with this number or invalid property data');
        return;
      }

      if (data[0]?.geom) {
        const firstProperty = data[0];

        const propertyFeature = {
          type: 'Feature',
          geometry: firstProperty.geom,
          properties: {
            id: propertyNumberToSearch,
            matrikkelnummer: firstProperty.matrikkelnummer
          }
        } as GeoJSON.Feature;

        if (!loggedPropertyData.current) {
          console.log('Current property data:', firstProperty);
          loggedPropertyData.current = true;
        }

        setPropertyBoundaries([propertyFeature]);

        const newBoundaryLayer = L.geoJSON(firstProperty.geom, {
          style: {
            color: 'blue',
            weight: 2,
            fillOpacity: 0.1
          }
        });

        if (mapRef.current) {
          newBoundaryLayer.addTo(mapRef.current);
          setPropertyBoundary(newBoundaryLayer);

          mapRef.current.fitBounds(newBoundaryLayer.getBounds(), {
            maxZoom: MAX_ZOOM,
            padding: [20, 20]
          });
          setInitialSearchSuccessful(true);

          fetchAllowedAreaForProperty(propertyNumberToSearch);

        } else {
          setErrorMessage('Map not ready to display property boundary.');
          setInitialSearchSuccessful(false);
        }

      } else {
        setErrorMessage('Invalid property data received (missing geometry).');
        setInitialSearchSuccessful(false);
      }
    } catch (error) {
      console.error("Error during property search:", error);
      setErrorMessage("An error occurred during the search.");
      setInitialSearchSuccessful(false);
    }
  }, [searchInput, clearMapState, setErrorMessage, setPropertyBoundaries]);

  // --- Handler to center map on property ---
  const handleCenterOnProperty = useCallback(() => {
    if (mapRef.current && propertyBoundary) {
      mapRef.current.fitBounds(propertyBoundary.getBounds(), {
        maxZoom: MAX_ZOOM,
        padding: [20, 20]
      });
    } else {
      console.warn("Cannot center: Map or property boundary not available.");
    }
  }, [propertyBoundary]);

  // Consolidated useEffect for Initial/Auto Search
  useEffect(() => {
    if (!mapReady || !autoZoom || initialSearchAttemptedRef.current || initialSearchSuccessful) {
      return;
    }

    if (userGnr && userBnr) {
      const propertyNumber = formatPropertyNumber(userGnr, userBnr, userFnr, userSnr);
      if (propertyNumber) {
        console.log("Attempting initial/auto search via props for:", propertyNumber);
        initialSearchAttemptedRef.current = true;
        setSearchInput(propertyNumber);
        setInitialSearchSuccessful(false);
        void handlePropertySearch(propertyNumber);
      }
    }
  }, [
    mapReady,
    userGnr,
    userBnr,
    userFnr,
    userSnr,
    autoZoom,
    initialSearchSuccessful,
    handlePropertySearch,
    setSearchInput
  ]);

  // --- Effect to add/update allowed area layer on map ---
  useEffect(() => {
    if (!mapRef.current || !allowedAreaGeoJson) {
      if (allowedAreaLayerRef.current && mapRef.current) {
        mapRef.current.removeLayer(allowedAreaLayerRef.current);
        allowedAreaLayerRef.current = null;
      }
      return;
    };

    if (allowedAreaLayerRef.current) {
      mapRef.current.removeLayer(allowedAreaLayerRef.current);
    }

    const newLayer = L.geoJSON(allowedAreaGeoJson, {
      style: {
        color: "#28a745",
        weight: 2,
        fillOpacity: 0.3
      }
    }).addTo(mapRef.current);
    allowedAreaLayerRef.current = newLayer;
  }, [allowedAreaGeoJson]);

  const MapEvents = () => {
    const map = useMap();

    useEffect(() => {
      if (!map || mapReadyCallbackFired.current) return;

      console.log("MapEvents: Map instance ready.");
      mapRef.current = map;
      setMapReady(true);
      mapReadyCallbackFired.current = true;

      if (stableOnMapReady) {
        try {
          stableOnMapReady(map);
        } catch (error) {
          console.error('Error in onMapReady callback:', error);
        }
      }
    }, [map]);

    return null;
  };

  const handleShapeDrawn = useCallback((shape: GeoJSON.Feature, spatialAnalysis?: SpatialAnalysisResult) => {
    if (onShapeDrawn) {
      onShapeDrawn(shape, spatialAnalysis);
    }
  }, [onShapeDrawn, propertyBoundaries, allowedAreaGeoJson]);

  return (
    <div className='flex flex-col w-full'>
      {errorMessage && (
        <div className="text-red-500 mb-4 p-2 bg-red-50 rounded">{errorMessage}</div>
      )}

      <div className="h-[500px] w-full relative">
        <MapContainer
          center={[58.1447, 7.99828]}
          zoom={zoom}
          maxZoom={MAX_ZOOM}
          className="h-full w-full rounded-r-lg"
        >
          <MapEvents />
          {mapReady && mapRef.current &&
            <DrawControl
              map={mapRef.current}
              onShapeDrawn={handleShapeDrawn}
              propertyBoundaries={propertyBoundaries}
              allowedAreaBoundary={allowedAreaGeoJson}
            />
          }

          <LayersControl position="topright">
            <BaseLayer checked name="OpenStreetMap">
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="© OpenStreetMap contributors"
                maxZoom={MAX_ZOOM}
              />
            </BaseLayer>

            <Overlay checked name="FKB Layer">
              <WMSTileLayer
                url="https://wms.geonorge.no/skwms1/wms.fkb?"
                layers="fkb"
                format="image/png"
                transparent={true}
                version="1.3.0"
                maxZoom={MAX_ZOOM}
                tileSize={512}
                zoomOffset={-1}
              />
            </Overlay>

            <Overlay checked name="Matrikkelkart">
              <WMSTileLayer
                url="https://wms.geonorge.no/skwms1/wms.matrikkelkart?"
                layers="teiger"
                format="image/png"
                transparent={true}
                version="1.3.0"
                maxZoom={MAX_ZOOM}
                tileSize={512}
                zoomOffset={-1}
              />
            </Overlay>
            <Overlay name="Kommuneplan">
              <WMSTileLayer
                url="https://wms.geonorge.no/skwms1/wms.kommuneplaner?request=GetCapabilities&service=WMS"
                layers="KOMMUNEPLANER_WMS"
                format="image/png"
                transparent={true}
                version="1.3.0"
                maxZoom={MAX_ZOOM}
                tileSize={512}
                zoomOffset={-1}
              />
            </Overlay>
          </LayersControl>

          {propertyBoundary && (
            <button
              onClick={handleCenterOnProperty}
              className="absolute bottom-4 left-2.5 z-[1000] bg-white p-2 rounded shadow-md hover:bg-gray-100 transition-colors"
              title="Sentrer på eiendom"
              aria-label="Sentrer kartet på eiendommen"
            >
              <Home size={18} />
            </button>
          )}

        </MapContainer>
      </div>
    </div>
  );
};

export default TiltaksAidMap;
export type { SpatialAnalysisResult };