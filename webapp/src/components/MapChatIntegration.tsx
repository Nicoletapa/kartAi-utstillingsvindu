'use client';
import { useRef, useState, useCallback } from 'react';
import TiltaksAidMap from './TiltaksAidMap';
import { PlanPrat } from './PlanChatAtlas';
import type { Map } from 'leaflet';
import type { SpatialAnalysisResult } from '~/utils/propertyUtils';
import { usePropertySearch } from '~/hooks/usePropertySearch';

export function MapChatIntegration() {
  const mapStateRef = useRef<{ map: Map | null; ready: boolean }>({ map: null, ready: false });
  const [mapReady, setMapReady] = useState(false); // Keep this if PlanPrat still uses it internally, otherwise remove
  const [lastDrawnShape, setLastDrawnShape] = useState<GeoJSON.Feature | null>(null);
  const [spatialAnalysis, setSpatialAnalysis] = useState<SpatialAnalysisResult | null>(null);
  const [isPlanPratOpen, setIsPlanPratOpen] = useState(true);
  
  const { userData } = usePropertySearch();
 
  const handleMapReady = useCallback((map: Map) => {
    if (mapStateRef.current.map) return;
    mapStateRef.current = { map, ready: true };
    setMapReady(true); // Keep if needed
  }, []);

  const handleShapeDrawn = useCallback((shape: GeoJSON.Feature, analysis?: SpatialAnalysisResult) => {
    setLastDrawnShape(shape);
    setSpatialAnalysis(analysis ?? null);
  }, []);

  return (
    <div className={`flex flex-col md:flex-row mb-16 max-w-[900px] mx-auto px-4 transition-all duration-300`}>
      <div className="md:w-2/5 h-1/2">
        <PlanPrat
          mapRefFromStore={mapStateRef.current}
          // --- Rename props to match PlanPratProps ---
          lastDrawnShapeFromStore={lastDrawnShape}
          spatialAnalysisFromStore={spatialAnalysis}
          // -------------------------------------------
          onClose={() => console.log('PlanPrat closed')}
          disableTopRightRadius={true}
          disableBottomRightRadius={true}
        />
      </div>

      <div className="md:w-3/5 h-1/2 z-10 shadow-lg">
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