'use client';
import { useRef, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { MapContainer, TileLayer, useMap, WMSTileLayer } from 'react-leaflet';
import * as L from 'leaflet';
import type { Map } from 'leaflet';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';



const LayersControl = dynamic(() => import('react-leaflet').then((mod) => mod.LayersControl), { ssr: false });
const BaseLayer = dynamic(() => import('react-leaflet').then((mod) => mod.LayersControl.BaseLayer), { ssr: false });
const Overlay = dynamic(() => import('react-leaflet').then((mod) => mod.LayersControl.Overlay), { ssr: false });

const DrawControl = ({ map }: { map: Map }) => {
  useEffect(() => {
    if (!map) return;

    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    const drawControl = new L.Control.Draw({
      edit: {
        featureGroup: drawnItems,
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
    map.addControl(drawControl);


    map.on(L.Draw.Event.CREATED, ((e: L.DrawEvents.Created) => {
      const layer = e.layer;
      drawnItems.addLayer(layer);
      
      if (layer instanceof L.Polygon || layer instanceof L.Rectangle) {
        const geoJson = layer.toGeoJSON();
        console.log('Drawn shape GeoJSON:', geoJson);
      }
    }) as L.LeafletEventHandlerFn);

    return () => {
      map.removeControl(drawControl);
      map.removeLayer(drawnItems);
      map.off(L.Draw.Event.CREATED);
    };
  }, [map]);

  return null;
};

interface PropertyData {
  geom: GeoJSON.GeoJSON;
}

const TiltaksAidMap = () => {
  const mapRef = useRef<Map | null>(null);
  const [zoom] = useState(15);
  const [searchInput, setSearchInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [propertyBoundary, setPropertyBoundary] = useState<L.Layer | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const handlePropertySearch = async () => {
    if (!searchInput.trim()) {
      setErrorMessage('Please enter a property number');
      return;
    }

    try {
      const response = await fetch(
        `https://dctlsklovjueodoiygak.supabase.co/rest/v1/teig_utvalg?select=geom&matrikkelnummertekst=eq.${searchInput}`,
        {
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_KEY ?? '',
            'Content-Type': 'application/json'
          }
        }
      );
      
      const data = await response.json() as PropertyData[];

      if (data.length > 0) {
        if (propertyBoundary && mapRef.current) {
          mapRef.current.removeLayer(propertyBoundary);
        }

        const newBoundary = L.geoJSON(data[0]?.geom, {
          style: {
            color: 'blue',
            weight: 2,
            fillOpacity: 0.1
          }
        });

        if (mapRef.current) {
          newBoundary.addTo(mapRef.current);
          mapRef.current.fitBounds(newBoundary.getBounds());
        }

        setPropertyBoundary(newBoundary);
        setErrorMessage(null);
      } else {
        setErrorMessage('No property found with this number');
      }
    } catch (error) {
      setErrorMessage(`Error searching for property: ${(error as Error).message}`);
    }
  };
  
  const MapEvents = () => {
    const map = useMap();
    
    useEffect(() => {
      if (map) {
        mapRef.current = map;
        setMapReady(true);
      }
    }, [map]);
    
    return null;
  };

  // Add script to load Leaflet Draw from CDN
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
          className="h-full w-full"
        >
          <MapEvents />
          {mapReady && mapRef.current && <DrawControl map={mapRef.current} />}
          
          <LayersControl position="topright">
            <BaseLayer checked name="OpenStreetMap">
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="© OpenStreetMap contributors"
                maxZoom={21}
              />
            </BaseLayer>
            
            <Overlay name="FKB Layer">
              <WMSTileLayer
                url="https://wms.geonorge.no/skwms1/wms.fkb?"
                layers="fkb"
                format="image/png"
                transparent={true}
                version="1.3.0"
                maxZoom={21}
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
                maxZoom={21}
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