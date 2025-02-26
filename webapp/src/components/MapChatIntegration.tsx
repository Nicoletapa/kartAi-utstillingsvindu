'use client';
import { useRef, useState } from 'react';
import TiltaksAidMap from './TiltaksAidMap';
import { PlanPrat } from './PlanChatAtlas';
import type { Map } from 'leaflet';

export function MapChatIntegration() {
  // Shared state between map and chat
  const mapRef = useRef<Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [lastDrawnShape, setLastDrawnShape] = useState<GeoJSON.Feature | null>(null);
  
  // Function to handle when the map is ready
  const handleMapReady = (map: Map) => {
    mapRef.current = map;
    setMapReady(true);
    console.log('Map is ready and accessible to chat');
  };
  
  // Function to handle when a shape is drawn on the map
  const handleShapeDrawn = (shape: GeoJSON.Feature) => {
    setLastDrawnShape(shape);
    console.log('Shape sent to chat:', shape);
  };
  
  return (
    <div className="flex flex-col md:flex-row h-screen">
      <div className="md:w-1/2 h-1/2 md:h-full">
        <TiltaksAidMap 
          onMapReady={handleMapReady} 
          onShapeDrawn={handleShapeDrawn}
        />
      </div>
      <div className="md:w-1/2 h-1/2 md:h-full">
        <PlanPrat 
          mapRef={mapRef}
          lastDrawnShape={lastDrawnShape}
          mapReady={mapReady}
        />
      </div>
    </div>
  );
}

export default MapChatIntegration;