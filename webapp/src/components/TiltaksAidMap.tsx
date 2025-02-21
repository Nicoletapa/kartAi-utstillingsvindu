'use client';

import { useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { MapContainer, TileLayer, WMSTileLayer } from 'react-leaflet';
import * as L from 'leaflet';

// Dynamically import all map components with no SSR
const LayersControl = dynamic(() => import('react-leaflet').then((mod) => mod.LayersControl), { ssr: false });
const BaseLayer = dynamic(() => import('react-leaflet').then((mod) => mod.LayersControl.BaseLayer), { ssr: false });
const Overlay = dynamic(() => import('react-leaflet').then((mod) => mod.LayersControl.Overlay), { ssr: false });




const TiltaksAidMap = () => {
  const mapRef = useRef<L.Map | null>(null);
  const [zoom] = useState(15);
  //const [isMounted, setIsMounted] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [propertyBoundary, setPropertyBoundary] = useState<L.Layer | null>(null);

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
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_KEY || '',
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();

      if (data.length > 0) {
        // Clear previous boundary if exists
        if (propertyBoundary && mapRef.current) {
          mapRef.current.removeLayer(propertyBoundary);
        }

        // Create new boundary
        const newBoundary = L.geoJSON(data[0].geom, {
          style: {
            color: 'blue',
            weight: 2,
            fillOpacity: 0.1
          }
        });

        // Add to map and zoom to boundary
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
          ref={mapRef}
          className="h-full w-full"
        >
          <LayersControl position="topright">
            <BaseLayer checked name="OpenStreetMap">
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="© OpenStreetMap contributors"
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
