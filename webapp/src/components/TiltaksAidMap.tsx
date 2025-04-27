'use client';
import { useRef, useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { MapContainer, TileLayer, useMap, WMSTileLayer } from 'react-leaflet';
import * as L from 'leaflet';
import type { Map } from 'leaflet';
import type { Feature, Geometry, GeoJsonProperties } from 'geojson'; // Add missing imports
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
//import { PropertySearchBar } from './map/PropertySearchBar';
import { 
   
  analyzeSpatialRelationship,
  formatPropertyNumber,
  searchProperty as fetchProperty
} from '~/utils/propertyUtils';
import { usePropertySearch } from '~/hooks/usePropertySearch';

import type { SpatialAnalysisResult } from '~/utils/propertyUtils';

const LayersControl = dynamic(() => import('react-leaflet').then((mod) => mod.LayersControl), { ssr: false });
const BaseLayer = dynamic(() => import('react-leaflet').then((mod) => mod.LayersControl.BaseLayer), { ssr: false });
const Overlay = dynamic(() => import('react-leaflet').then((mod) => mod.LayersControl.Overlay), { ssr: false });

interface DrawControlProps {
  map: Map;
  onShapeDrawn?: (shape: GeoJSON.Feature, spatialAnalysis?: SpatialAnalysisResult) => void;
  propertyBoundaries?: GeoJSON.Feature[];
}

// Keep the DrawControl component as is
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
      
      // Fix the type safety issues by properly casting the GeoJSON result
      const geoJson = layer.toGeoJSON() as Feature<Geometry, GeoJsonProperties>;
      console.log('Drawn shape GeoJSON:', geoJson);
      
      // Perform spatial analysis if we have property boundaries
      let spatialAnalysis: SpatialAnalysisResult | undefined;
      
      if (propertyBoundaries.length > 0) {
        spatialAnalysis = analyzeSpatialRelationship(geoJson, propertyBoundaries);
        console.log('Spatial analysis:', spatialAnalysis);
      }
      
      if (onShapeDrawn) {
        onShapeDrawn(geoJson, spatialAnalysis);
      }
    }) as L.LeafletEventHandlerFn;

    // Add event listener
    map.on(L.Draw.Event.CREATED, handleDrawCreated);

    // Also handle edit events to update analysis
    map.on(L.Draw.Event.EDITED, ((e: L.DrawEvents.Edited) => {
      const layers = e.layers;
      layers.eachLayer((layer: L.Layer) => {
        // Use proper typing for the layer
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
      // Only remove event listener, keep the control and layers
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
  const [propertyBoundary, setPropertyBoundary] = useState<L.Layer | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [propertyBoundaries, setPropertyBoundaries] = useState<GeoJSON.Feature[]>([]);
  const [autoZoomAttempted, setAutoZoomAttempted] = useState(false);
  const [autoZoomSuccessful, setAutoZoomSuccessful] = useState(false);

  // Use our custom hook
  const { 
    searchInput, 
    setSearchInput, 
    errorMessage, 
    setErrorMessage
  } = usePropertySearch();

  // Ref to track if we've already triggered map ready callback
  const mapReadyCallbackFired = useRef(false);
  const stableOnMapReady = useRef(onMapReady).current;

  // Add ref to track logging status
  const loggedPropertyData = useRef(false);

  const handlePropertySearch = useCallback(async (propertyNumberToSearch: string = searchInput) => {
    const data = await fetchProperty(propertyNumberToSearch, process.env.NEXT_PUBLIC_SUPABASE_KEY);
    
    if (!data || data.length === 0) {
      setErrorMessage('No property found with this number or invalid property data');
      return;
    }
    
    if (data[0]?.geom) {
      if (propertyBoundary && mapRef.current) {
        mapRef.current.removeLayer(propertyBoundary);
      }
  
      // Convert the property data to a GeoJSON feature with ID
      const propertyFeature = {
        type: 'Feature',
        geometry: data[0]?.geom,
        properties: { 
          id: propertyNumberToSearch,
          matrikkelnummer: data[0]?.matrikkelnummer
        }
      } as GeoJSON.Feature;
  
      // Replace setter with direct assignment to a local constant to prevent unused state
      const currentPropertyData = data[0] ?? null;
      
      // Only log once per component instance
      if (!loggedPropertyData.current && currentPropertyData) {
        console.log('Current property data:', currentPropertyData);
        loggedPropertyData.current = true;
      }
      
      setPropertyBoundaries([propertyFeature]);
  
      const newBoundary = L.geoJSON(data[0]?.geom, {
        style: {
          color: 'blue',
          weight: 2,
          fillOpacity: 0.1
        }
      });
  
      if (mapRef.current) {
        newBoundary.addTo(mapRef.current);
        
        mapRef.current.fitBounds(newBoundary.getBounds(), {
          maxZoom: MAX_ZOOM,
          padding: [20, 20] 
        });
        
        setAutoZoomSuccessful(true);
      }
  
      setPropertyBoundary(newBoundary);
      setErrorMessage(null);
    }
  }, [mapRef, propertyBoundary, searchInput, setErrorMessage, setPropertyBoundaries, setPropertyBoundary, setAutoZoomSuccessful]);

  // Force a search when user property data changes
  useEffect(() => {
    if (autoZoomSuccessful || !userGnr || !userBnr) return;
    
    const propertyNumber = formatPropertyNumber(userGnr, userBnr, userFnr, userSnr);
    if (propertyNumber) {
      setSearchInput(propertyNumber);
      
      if (mapReady && !autoZoomAttempted) {
        setAutoZoomAttempted(true);
        void handlePropertySearch(propertyNumber); // Add void to acknowledge floating promise
      }
    }
  }, [userGnr, userBnr, userFnr, userSnr, mapReady, autoZoomAttempted, autoZoomSuccessful, setSearchInput, handlePropertySearch]);

  // Auto-zoom effect
  useEffect(() => {
    if (!mapReady || !autoZoom || autoZoomAttempted || autoZoomSuccessful) return;
    
    if (!userGnr || !userBnr) return;

    const propertyNumber = formatPropertyNumber(userGnr, userBnr, userFnr, userSnr);
    if (propertyNumber) {
      setAutoZoomAttempted(true);
      void handlePropertySearch(propertyNumber); // Add void to acknowledge floating promise
    }
  }, [mapReady, userGnr, userBnr, userFnr, userSnr, autoZoom, autoZoomAttempted, autoZoomSuccessful, handlePropertySearch]);



  const MapEvents = () => {
    const map = useMap();
    
    useEffect(() => {
      if (!map || mapReadyCallbackFired.current) return;
      
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
      
      if (searchInput && !autoZoomAttempted && !autoZoomSuccessful && userGnr && userBnr) {
        setAutoZoomAttempted(true);
        void handlePropertySearch(searchInput); // Add void to acknowledge floating promise
      }
    }, [map, searchInput, autoZoomAttempted, autoZoomSuccessful, userGnr, userBnr]);
    
    return null;
  };

  // Handle shape drawing with spatial analysis
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
      document.head.removeChild(script);
    };
  }, []);

  return (
    <div className='flex flex-col w-full shadow-lg'>
      {/* <PropertySearchBar
        searchInput={searchInput}
        onSearchInputChange={setSearchInput}
        onSearch={() => handlePropertySearch()}
        errorMessage={errorMessage}
      /> */}
      {errorMessage && (
        <div className="text-red-500 mb-4 p-2 bg-red-50 rounded">{errorMessage}</div>
      )}

      <div className="h-[500px] w-full">
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
          </LayersControl>
        </MapContainer>
      </div>
    </div>
  );
};

export default TiltaksAidMap;
export type { SpatialAnalysisResult };