'use client';
import { useRef, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { MapContainer, TileLayer, useMap, WMSTileLayer } from 'react-leaflet';
import * as L from 'leaflet';
import * as turf from '@turf/turf';  // Add this import
import type { Map } from 'leaflet';
import type { Feature, Geometry, GeoJsonProperties } from 'geojson';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';

const LayersControl = dynamic(() => import('react-leaflet').then((mod) => mod.LayersControl), { ssr: false });
const BaseLayer = dynamic(() => import('react-leaflet').then((mod) => mod.LayersControl.BaseLayer), { ssr: false });
const Overlay = dynamic(() => import('react-leaflet').then((mod) => mod.LayersControl.Overlay), { ssr: false });

interface DrawControlProps {
  map: Map;
  onShapeDrawn?: (shape: GeoJSON.Feature, spatialAnalysis?: SpatialAnalysisResult) => void;
  propertyBoundaries?: GeoJSON.Feature[];
}

// Create a persistent FeatureGroup that won't be recreated on re-renders
const drawnItemsRef = new L.FeatureGroup();

// New interface for spatial analysis results
interface SpatialAnalysisResult {
  isWithinProperty: boolean;
  distanceToProperty: number | null;  // in meters
  nearestPropertyId?: string | null;
  intersection?: GeoJSON.Feature | null;
}

const DrawControl = ({ map, onShapeDrawn, propertyBoundaries = [] }: DrawControlProps) => {
  // Track if draw control is initialized
  const drawControlRef = useRef<L.Control.Draw | null>(null);

  useEffect(() => {
    if (!map) return;
    
    // Add the feature group to the map only once
    if (!map.hasLayer(drawnItemsRef)) {
      map.addLayer(drawnItemsRef);
    }

    // Only initialize draw control once
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

// New function to analyze spatial relationships
function analyzeSpatialRelationship(
  drawnShape: GeoJSON.Feature,
  propertyBoundaries: GeoJSON.Feature[]
): SpatialAnalysisResult {
  let isWithinProperty = false;
  let minDistance = Infinity;
  let nearestPropertyId = null;
  let intersection = null;

  // Default result if no analysis can be performed
  const defaultResult: SpatialAnalysisResult = {
    isWithinProperty: false,
    distanceToProperty: null,
    nearestPropertyId: null,
    intersection: null
  };

  // Handle case where no property boundaries exist
  if (!propertyBoundaries.length) {
    return defaultResult;
  }

  try {
    // Loop through each property boundary and check relationship
    propertyBoundaries.forEach(property => {
      // Validate property before processing
      if (!property || !property.geometry) {
        console.warn('Invalid property object encountered:', property);
        return; // Skip this property
      }

      // Check if drawn shape is within property
      try {
        // For point features
        if (drawnShape.geometry.type === 'Point') {
          // Create a proper point feature for turf.js from the coordinates
          const pointCoords = turf.point((drawnShape.geometry as GeoJSON.Point).coordinates);
          
          if (property.geometry.type === 'Polygon' || property.geometry.type === 'MultiPolygon') {
            // Fix: Use GeoJSON types instead of turf.helpers.Feature
            const polygonFeature = property as GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>;
            const pointWithin = turf.booleanPointInPolygon(pointCoords, polygonFeature);
            
            if (pointWithin) {
              isWithinProperty = true;
              nearestPropertyId = property.properties?.id || null;
            }
          }
        } 
        // For polygons and lines
        else if (drawnShape.geometry.type === 'Polygon' || drawnShape.geometry.type === 'MultiPolygon') {
          // Fix: Use GeoJSON types for type casting
          const drawnPolygon = drawnShape as GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>;
          
          if (property.geometry.type === 'Polygon' || property.geometry.type === 'MultiPolygon') {
            // Fix: Use GeoJSON types for type casting
            const propertyPolygon = property as GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>;
            
            const overlaps = turf.booleanOverlap(drawnPolygon, propertyPolygon);
            const within = turf.booleanWithin(drawnPolygon, propertyPolygon);
            
            if (overlaps || within) {
              isWithinProperty = true;
              nearestPropertyId = property.properties?.id || null;
              
              // Use intersect with proper error handling
              try {
                intersection = turf.intersect(
                  drawnPolygon as any, 
                  propertyPolygon as any
                );
              } catch (e) {
                console.error('Error calculating intersection:', e);
              }
            }
          }
        }
        
        // Calculate distance if not within property
        if (!isWithinProperty && property.geometry) {
          try {
            // Get centers as proper points for distance calculation
            const drawnShapeCenter = turf.centerOfMass(drawnShape);
            const propertyCenter = turf.centerOfMass(property);
            
            const distance = turf.distance(
              drawnShapeCenter,
              propertyCenter,
              { units: 'meters' }
            );
            
            if (distance < minDistance) {
              minDistance = distance;
              nearestPropertyId = property.properties?.id || null;
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
    return defaultResult;
  }

  return {
    isWithinProperty,
    distanceToProperty: isWithinProperty ? 0 : minDistance === Infinity ? null : minDistance,
    nearestPropertyId,
    intersection
  };
}

interface PropertyData {
  geom: GeoJSON.GeoJSON;
  matrikkelnummer?: string;
}

interface TiltaksAidMapProps {
  onMapReady?: (map: Map) => void;
  onShapeDrawn?: (shape: GeoJSON.Feature, spatialAnalysis?: SpatialAnalysisResult) => void;
}

const TiltaksAidMap = ({ onMapReady, onShapeDrawn }: TiltaksAidMapProps) => {
  const mapRef = useRef<Map | null>(null);
  const [zoom] = useState(15);
  const MAX_ZOOM = 19; 
  const [searchInput, setSearchInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [propertyBoundary, setPropertyBoundary] = useState<L.Layer | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [propertyBoundaries, setPropertyBoundaries] = useState<GeoJSON.Feature[]>([]);
  
  // Fix unused variable warning by removing or using the state
  // Option 1: Remove the unused state
  // Option 2: Keep it and use it somewhere (showing here)
  const [currentPropertyData, setCurrentPropertyData] = useState<PropertyData | null>(null);

  // Add a useEffect that uses currentPropertyData for something
  useEffect(() => {
    if (currentPropertyData) {
      // Do something with the data, for example log it
      console.log('Current property data:', currentPropertyData);
      // Or set a document title with property info
      // document.title = `Property: ${currentPropertyData.matrikkelnummer || 'Unknown'}`;
    }
  }, [currentPropertyData]);

  const handlePropertySearch = async () => {
    if (!searchInput.trim()) {
      setErrorMessage('Please enter a property number');
      return;
    }

    try {
      const response = await fetch(
        `https://dctlsklovjueodoiygak.supabase.co/rest/v1/teig_utvalg?select=geom,matrikkelnummertekst&matrikkelnummertekst=eq.${searchInput}`,
        {
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_KEY ?? '',
            'Content-Type': 'application/json'
          }
        }
      );
      
      const data = await response.json() as PropertyData[];
      console.log('API response for property search:', data);

      if (data.length > 0 && data[0]?.geom) {
        if (propertyBoundary && mapRef.current) {
          mapRef.current.removeLayer(propertyBoundary);
        }

        // Add debug logging to check the structure
        console.log('Raw property data:', data[0]);
        console.log('Property geom:', data[0]?.geom);

        // Convert the property data to a GeoJSON feature with ID
        // Ensure the geom object has the correct structure for a GeoJSON Feature
        const propertyFeature = {
          type: 'Feature',
          geometry: data[0]?.geom,
          properties: { 
            id: searchInput,
            matrikkelnummer: data[0]?.matrikkelnummer
          }
        } as GeoJSON.Feature;

        // Debug log the created feature
        console.log('Created property feature:', propertyFeature);

        // Save the raw property data - fix undefined error with null coalescing
        setCurrentPropertyData(data[0] ?? null);
        
        // Update our property boundaries state
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
        }

        setPropertyBoundary(newBoundary);
        setErrorMessage(null);
      } else {
        console.warn('No valid property data found:', data);
        setErrorMessage('No property found with this number or invalid property data');
      }
    } catch (error) {
      console.error('Error searching for property:', error);
      setErrorMessage(`Error searching for property: ${(error as Error).message}`);
    }
  };
  
  const MapEvents = () => {
    const map = useMap();
    
    useEffect(() => {
      if (map) {
        mapRef.current = map;
        setMapReady(true);
        if (onMapReady) {
          onMapReady(map);
        }
      }
    }, [map]);
    
    return null;
  };

  // Handle shape drawing with spatial analysis
  const handleShapeDrawn = (shape: GeoJSON.Feature, spatialAnalysis?: SpatialAnalysisResult) => {
    if (onShapeDrawn) {
      // If it's a new shape and we have property boundaries, calculate spatial relationships
      if (!spatialAnalysis && propertyBoundaries.length > 0) {
        spatialAnalysis = analyzeSpatialRelationship(shape, propertyBoundaries);
      }
      
      onShapeDrawn(shape, spatialAnalysis);
    }
  };

  // Add required packages
  useEffect(() => {
    // Dynamically import @turf/turf
    const importTurf = async () => {
      try {
        await import('@turf/turf');
        console.log('Turf.js loaded successfully');
      } catch (error) {
        console.error('Error loading Turf.js:', error);
      }
    };
    
    importTurf();
  }, []);

  // Load Leaflet Draw script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.js";
    script.async = true;
    script.onload = () => {
      console.log('Leaflet Draw loaded');
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // Handle cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        // Clear any drawn items if needed on component unmount
        // drawnItemsRef.clearLayers();
      }
    };
  }, []);

  return (
    <div className='flex flex-col w-full'>
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search property number (e.g., 152/842)"
          className="flex-1 p-2 border rounded"
          onKeyPress={(e) => e.key === 'Enter' && handlePropertySearch()}
        />
        <button
          onClick={handlePropertySearch}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Search Property
        </button>
      </div>
      {errorMessage && (
        <div className="text-red-500 mb-4 p-2 bg-red-50 rounded">{errorMessage}</div>
      )}

      <div className="h-[500px] w-full">
        <MapContainer
          center={[58.1447, 7.99828]}
          zoom={zoom}
          maxZoom={MAX_ZOOM}
          className="h-full w-full"
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
            
            <Overlay name="FKB Layer">
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

            <Overlay name="Matrikkelkart">
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