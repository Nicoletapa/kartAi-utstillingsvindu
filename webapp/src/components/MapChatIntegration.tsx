'use client';
import { useRef, useState, useCallback } from 'react';
import TiltaksAidMap from './TiltaksAidMap';
import { PlanPrat } from './PlanChatAtlas';
import type { Map } from 'leaflet';
import type { SpatialAnalysisResult } from '~/utils/propertyUtils';
import { usePropertySearch } from '~/hooks/usePropertySearch';

export function MapChatIntegration() {
  // Shared state between map and chat
  const mapRef = useRef<Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [lastDrawnShape, setLastDrawnShape] = useState<GeoJSON.Feature | null>(null);
  const [spatialAnalysis, setSpatialAnalysis] = useState<SpatialAnalysisResult | null>(null);
  
  // Get user property data
  const { userData } = usePropertySearch();
  
  // Memoize callbacks to prevent unnecessary re-renders
  const handleMapReady = useCallback((map: Map) => {
    if (mapRef.current) return; // Prevent duplicate calls
    mapRef.current = map;
    setMapReady(true);
  }, []);
  
  const handleShapeDrawn = useCallback((shape: GeoJSON.Feature, analysis?: SpatialAnalysisResult) => {
    setLastDrawnShape(shape);
    setSpatialAnalysis(analysis || null);
  }, []);
  
  return (
    <div className="flex flex-col-reverse lg:flex-row h-screen max-h-[80vh] rounded-lg overflow-hidden shadow-lg border border-gray-200">
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
          userGnr={userData?.gnr}
          userBnr={userData?.bnr}
          userFnr={userData?.fnr}
          userSnr={userData?.snr}
          autoZoom={true}
        />
      </div>
    </div>
  );
}

export default MapChatIntegration;