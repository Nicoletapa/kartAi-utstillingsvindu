"use client";
import { useRef, useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useMap } from "react-leaflet";
import * as L from "leaflet";
import type { Map } from "leaflet";
import type { Feature, Geometry, GeoJsonProperties } from "geojson";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";
import { Home } from "lucide-react";
import {
  analyzeSpatialRelationship,
  formatPropertyNumber,
  searchProperty as fetchProperty,
  fetchAllowedBuildingArea,
  createFeatureFromPropertyData, // Import the utility
} from "~/utils/propertyUtils";
import { usePropertySearch } from "~/hooks/usePropertySearch";
import type {
  SpatialAnalysisResult,
  PropertyData,
} from "~/utils/propertyUtils";

// Dynamically import Leaflet components to prevent hydration issues
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false },
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false },
);
const WMSTileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.WMSTileLayer),
  { ssr: false },
);
const LayersControl = dynamic(
  () => import("react-leaflet").then((mod) => mod.LayersControl),
  { ssr: false },
);
const BaseLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.LayersControl.BaseLayer),
  { ssr: false },
);
const Overlay = dynamic(
  () => import("react-leaflet").then((mod) => mod.LayersControl.Overlay),
  { ssr: false },
);

const getPolygonFeatures = (features: GeoJSON.Feature[]) => {
  return features.filter(
    (feature) =>
      feature.geometry.type === "Polygon" ||
      feature.geometry.type === "MultiPolygon",
  ) as GeoJSON.Feature<
    GeoJSON.Polygon | GeoJSON.MultiPolygon,
    GeoJsonProperties
  >[];
};

const performSpatialAnalysis = (
  shape: GeoJSON.Feature,
  boundaries: GeoJSON.Feature[],
  allowedArea: GeoJSON.Feature | null,
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
  onShapeDrawn?: (
    shape: GeoJSON.Feature,
    spatialAnalysis?: SpatialAnalysisResult,
  ) => void;
  propertyBoundaries?: GeoJSON.Feature[];
  allowedAreaBoundary?: GeoJSON.Feature | null;
}

const drawnItemsRef = new L.FeatureGroup();

const DrawControl = ({
  map,
  onShapeDrawn,
  propertyBoundaries = [],
  allowedAreaBoundary,
}: DrawControlProps) => {
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
          remove: true,
        },
        draw: {
          polygon: {
            allowIntersection: false,
            showArea: true,
          },
          rectangle: {
            shapeOptions: {
              color: "#97009c",
            },
          },
          marker: {
            icon: new L.Icon.Default(),
          },
          polyline: {
            shapeOptions: {
              color: "#3388ff",
              weight: 4,
            },
          },
          circle: {
            shapeOptions: {
              color: "#f03",
              fillOpacity: 0.2,
            },
          },
          circlemarker: false,
        },
      });
      map.addControl(drawControlRef.current);
    }

    const handleDrawCreated = ((e: L.DrawEvents.Created) => {
      const layer = e.layer;
      drawnItemsRef.addLayer(layer);

      const geoJson = layer.toGeoJSON() as Feature<Geometry, GeoJsonProperties>;
      console.log("Drawn shape GeoJSON:", geoJson);

      const spatialAnalysis = performSpatialAnalysis(
        geoJson,
        propertyBoundaries,
        allowedAreaBoundary ?? null,
      );
      console.log("Spatial analysis (incl. allowed area):", spatialAnalysis);

      if (onShapeDrawn) {
        onShapeDrawn(geoJson, spatialAnalysis);
      }
    }) as L.LeafletEventHandlerFn;

    const handleDrawEdited = ((e: L.DrawEvents.Edited) => {
      const layers = e.layers;
      layers.eachLayer((layer: L.Layer) => {
        const typedLayer = layer as L.Layer & {
          toGeoJSON: () => GeoJSON.Feature;
        };
        const geoJson = typedLayer.toGeoJSON();

        const spatialAnalysis = performSpatialAnalysis(
          geoJson,
          propertyBoundaries,
          allowedAreaBoundary ?? null,
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
  onShapeDrawn?: (
    shape: GeoJSON.Feature,
    spatialAnalysis?: SpatialAnalysisResult,
  ) => void;
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
  autoZoom = true,
}: TiltaksAidMapProps) => {
  const mapRef = useRef<Map | null>(null);
  const [zoom] = useState(15);
  const MAX_ZOOM = 19;
  const [propertyBoundary, setPropertyBoundary] = useState<L.GeoJSON | null>(
    null,
  );
  const [mapReady, setMapReady] = useState(false);
  const [propertyBoundaries, setPropertyBoundaries] = useState<
    GeoJSON.Feature[]
  >([]);
  const [initialSearchSuccessful, setInitialSearchSuccessful] = useState(false);
  const initialSearchAttemptedRef = useRef(false);
  const [allowedAreaGeoJson, setAllowedAreaGeoJson] =
    useState<GeoJSON.Feature | null>(null);
  const allowedAreaLayerRef = useRef<L.GeoJSON | null>(null);
  const { searchInput, setSearchInput, errorMessage, setErrorMessage } =
    usePropertySearch();

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
          supabaseKey,
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
  const handlePropertySearch = useCallback(
    async (propertyNumberToSearch: string = searchInput) => {
      clearMapState();

      try {
        const rawData: PropertyData[] | null = await fetchProperty(
          propertyNumberToSearch,
          process.env.NEXT_PUBLIC_SUPABASE_KEY,
        );

        // Use the utility function
        const { feature, error: featureError } = createFeatureFromPropertyData(
          rawData,
          propertyNumberToSearch,
        );

        if (featureError) {
          setErrorMessage(featureError);
          setInitialSearchSuccessful(false);
          return;
        }

        // feature is guaranteed to be a GeoJSON.Feature if no error
        if (feature) {
          if (!loggedPropertyData.current && rawData?.[0]) {
            console.log("Current property data:", rawData[0]);
            loggedPropertyData.current = true;
          }

          setPropertyBoundaries([feature]);

          const newBoundaryLayer = L.geoJSON(feature.geometry, {
            style: {
              color: "blue",
              weight: 2,
              fillOpacity: 0.1,
            },
          });

          if (mapRef.current) {
            newBoundaryLayer.addTo(mapRef.current);
            setPropertyBoundary(newBoundaryLayer);

            mapRef.current.fitBounds(newBoundaryLayer.getBounds(), {
              maxZoom: MAX_ZOOM,
              padding: [20, 20],
            });
            setInitialSearchSuccessful(true);
            setErrorMessage(null); // Clear error on success

            void fetchAllowedAreaForProperty(propertyNumberToSearch);
          } else {
            setErrorMessage("Map not ready to display property boundary.");
            setInitialSearchSuccessful(false);
          }
        } else {
          setErrorMessage("Invalid property data received.");
          setInitialSearchSuccessful(false);
        }
      } catch (error) {
        console.error("Error during property search:", error);
        setErrorMessage("An error occurred during the search.");
        setInitialSearchSuccessful(false);
      }
    },
    [
      searchInput,
      clearMapState,
      setErrorMessage,
      setPropertyBoundaries,
      fetchAllowedAreaForProperty,
    ],
  );

  // --- Handler to center map on property ---
  const handleCenterOnProperty = useCallback(() => {
    if (mapRef.current && propertyBoundary) {
      mapRef.current.fitBounds(propertyBoundary.getBounds(), {
        maxZoom: MAX_ZOOM,
        padding: [20, 20],
      });
    } else {
      console.warn("Cannot center: Map or property boundary not available.");
    }
  }, [propertyBoundary]);

  // Consolidated useEffect for Initial/Auto Search
  useEffect(() => {
    if (
      !mapReady ||
      !autoZoom ||
      initialSearchAttemptedRef.current ||
      initialSearchSuccessful
    ) {
      return;
    }

    if (userGnr && userBnr) {
      const propertyNumber = formatPropertyNumber(
        userGnr,
        userBnr,
        userFnr,
        userSnr,
      );
      if (propertyNumber) {
        console.log(
          "Attempting initial/auto search via props for:",
          propertyNumber,
        );
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
    setSearchInput,
  ]);

  // --- Effect to add/update allowed area layer on map ---
  useEffect(() => {
    if (!mapRef.current || !allowedAreaGeoJson) {
      if (allowedAreaLayerRef.current && mapRef.current) {
        mapRef.current.removeLayer(allowedAreaLayerRef.current);
        allowedAreaLayerRef.current = null;
      }
      return;
    }

    if (allowedAreaLayerRef.current) {
      mapRef.current.removeLayer(allowedAreaLayerRef.current);
    }

    const newLayer = L.geoJSON(allowedAreaGeoJson, {
      style: {
        color: "#28a745",
        weight: 2,
        fillOpacity: 0.3,
      },
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
          console.error("Error in onMapReady callback:", error);
        }
      }
    }, [map]);

    return null;
  };

  const handleShapeDrawn = useCallback(
    (shape: GeoJSON.Feature, spatialAnalysis?: SpatialAnalysisResult) => {
      if (onShapeDrawn) {
        onShapeDrawn(shape, spatialAnalysis);
      }
    },
    [onShapeDrawn],
  );

  return (
    <div className="flex w-full flex-col">
      {errorMessage && (
        <div className="mb-4 rounded bg-red-50 p-2 text-red-500">
          {errorMessage}
        </div>
      )}

      <div className="relative h-[500px] w-full">
        <MapContainer
          center={[58.1447, 7.99828]}
          zoom={zoom}
          maxZoom={MAX_ZOOM}
          className="h-full w-full rounded-r-lg"
        >
          <MapEvents />
          {mapReady && mapRef.current && (
            <DrawControl
              map={mapRef.current}
              onShapeDrawn={handleShapeDrawn}
              propertyBoundaries={propertyBoundaries}
              allowedAreaBoundary={allowedAreaGeoJson}
            />
          )}

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
              className="absolute bottom-4 left-2.5 z-[1000] rounded bg-white p-2 shadow-md transition-colors hover:bg-gray-100"
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
