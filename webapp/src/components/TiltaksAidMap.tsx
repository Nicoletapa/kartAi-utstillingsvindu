'use client';
import { useRef, useState, useEffect, useCallback } from 'react';

import dynamic from 'next/dynamic';
import { MapContainer, TileLayer, useMap, WMSTileLayer } from 'react-leaflet';
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
import type {SpatialAnalysisResult, PropertyData} from '~/utils/propertyUtils';

const LayersControl = dynamic(() => import('react-leaflet').then((mod) => mod.LayersControl), { ssr: false });
const BaseLayer = dynamic(() => import('react-leaflet').then((mod) => mod.LayersControl.BaseLayer), { ssr: false });
const Overlay = dynamic(() => import('react-leaflet').then((mod) => mod.LayersControl.Overlay), { ssr: false });

interface DrawControlProps {
  map: Map;
  onShapeDrawn?: (shape: GeoJSON.Feature, spatialAnalysis?: SpatialAnalysisResult) => void;
  propertyBoundaries?: GeoJSON.Feature[];
}

const drawnItemsRef = new L.FeatureGroup();
const DrawControl = ({ map, onShapeDrawn, propertyBoundaries = [] }: DrawControlProps) => {
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

      let spatialAnalysis: SpatialAnalysisResult | undefined;

      if (propertyBoundaries.length > 0) {
        spatialAnalysis = analyzeSpatialRelationship(geoJson, propertyBoundaries);
        console.log('Spatial analysis:', spatialAnalysis);
      }

      if (onShapeDrawn) {
        onShapeDrawn(geoJson, spatialAnalysis);
      }
    }) as L.LeafletEventHandlerFn;

    map.on(L.Draw.Event.CREATED, handleDrawCreated);

    map.on(L.Draw.Event.EDITED, ((e: L.DrawEvents.Edited) => {
      const layers = e.layers;
      layers.eachLayer((layer: L.Layer) => {
        const typedLayer = layer as L.Layer & { toGeoJSON: () => GeoJSON.Feature };
        const geoJson = typedLayer.toGeoJSON();
        let spatialAnalysis: SpatialAnalysisResult | undefined;

        if (propertyBoundaries.length > 0) {
          spatialAnalysis = analyzeSpatialRelationship(geoJson, propertyBoundaries);
        }

        if (onShapeDrawn) {
          onShapeDrawn(geoJson, spatialAnalysis);
        }
      });
    }) as L.LeafletEventHandlerFn);

    return () => {
      map.off(L.Draw.Event.CREATED, handleDrawCreated);
      map.off(L.Draw.Event.EDITED);
    };
  }, [map, onShapeDrawn, propertyBoundaries]);

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

  // --- Handle property search ---
  const handlePropertySearch = useCallback(async (propertyNumberToSearch: string = searchInput) => {
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

          // --- Fetch Allowed Building Area ---
          const allowedArea = await fetchAllowedBuildingArea(
            propertyNumberToSearch,
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_KEY  
          );
          if (allowedArea) {
            setAllowedAreaGeoJson(allowedArea); 
          } else {
            console.log("No allowed building area found or error fetching.");
            
          }

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
  }, [searchInput, propertyBoundary, setErrorMessage, setPropertyBoundaries]);

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
  // ---------------------------------------------

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
  // ------------------------------------------------------

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
        } catch(error) {
          console.error('Error in onMapReady callback:', error);
        }
      }
    }, [map]); 

    return null;
  };

  const handleShapeDrawn = (shape: GeoJSON.Feature, spatialAnalysis?: SpatialAnalysisResult) => {
    if (onShapeDrawn) {
      if (!spatialAnalysis && propertyBoundaries.length > 0) {
        spatialAnalysis = analyzeSpatialRelationship(shape, propertyBoundaries);
      }

      onShapeDrawn(shape, spatialAnalysis);
    }
  };

  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.js";
    script.async = true;
    document.head.appendChild(script);

    return () => {
      const existingScript = document.head.querySelector(`script[src="${script.src}"]`);
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);


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