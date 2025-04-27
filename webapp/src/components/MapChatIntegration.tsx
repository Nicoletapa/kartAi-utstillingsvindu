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
  
  
  const { userData } = usePropertySearch();
  
  
  const handleMapReady = useCallback((map: Map) => {
    if (mapRef.current) return; 
    mapRef.current = map;
    setMapReady(true);
  }, []);
  
  const handleShapeDrawn = useCallback((shape: GeoJSON.Feature, analysis?: SpatialAnalysisResult) => {
    setLastDrawnShape(shape);
    setSpatialAnalysis(analysis ?? null);
  }, []);
  
  return (
    <div className={`flex flex-col md:flex-row mb-16 max-w-[900px] mx-auto px-4 transition-all duration-300`}>
      <div className="md:w-2/5 h-1/2">
        <PlanPrat 
          mapRef={mapRef}
          lastDrawnShape={lastDrawnShape}
          spatialAnalysis={spatialAnalysis}
          mapReady={mapReady}
        />
      </div>
      
      <div className="md:w-3/5 h-1/2 z-10">
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