'use client';
import { useRef, useState } from 'react';
import TiltaksAidMap from './TiltaksAidMap';
import { PlanPrat } from './PlanChatAtlas';
import type { Map } from 'leaflet';
import type { SpatialAnalysisResult } from './TiltaksAidMap';

export function MapChatIntegration() {
  // Shared state between map and chat
  const mapRef = useRef<Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [lastDrawnShape, setLastDrawnShape] = useState<GeoJSON.Feature | null>(null);
  const [spatialAnalysis, setSpatialAnalysis] = useState<SpatialAnalysisResult | null>(null);
  
  // Function to handle when the map is ready
  const handleMapReady = (map: Map) => {
    mapRef.current = map;
    setMapReady(true);
    console.log('Map is ready and accessible to chat');
  };
  
  // Function to handle when a shape is drawn on the map
  const handleShapeDrawn = (shape: GeoJSON.Feature, analysis?: SpatialAnalysisResult) => {
    setLastDrawnShape(shape);
    if (analysis) {
      setSpatialAnalysis(analysis);
      console.log('Spatial analysis:', analysis);
    } else {
      setSpatialAnalysis(null);
    }
    console.log('Shape sent to chat:', shape);
  };
  
  return (
    <div className="flex  flex-col-reverse lg:flex-row h-screen max-h-[80vh] rounded-lg overflow-hidden shadow-lg border border-gray-200">
      {/* Chat on the left side */}
      <div className="lg:w-2/5 h-1/2 lg:h-full border-t lg:border-t-0 lg:border-r border-gray-200">
        <PlanPrat 
          mapRef={mapRef}
          lastDrawnShape={lastDrawnShape}
          spatialAnalysis={spatialAnalysis}
          mapReady={mapReady}
        />
      </div>
      
      {/* Map on the right side */}
      <div className="lg:w-3/5 h-1/2 lg:h-full">
        <TiltaksAidMap 
          onMapReady={handleMapReady} 
          onShapeDrawn={handleShapeDrawn}
        />
      </div>
    </div>
  );
}

export default MapChatIntegration;