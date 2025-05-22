/**
 * This file is used in Utstillingsvindu 2.0
 * 
 * @description
 * A component with a map (TiltaksAidMap.tsx) and a chat interface (PlanPratAtlas.tsx).
 * This makes up the full-size chatbot.
 * 
 * @features
 * - Map integration with chat interface
 * - Handles map readiness and shape drawing
 * - Manages spatial analysis results
 * - Uses hooks for property search data
 * 
 * @props
 * - `mapStateRef` (ref): Reference to the map state.
 * - `lastDrawnShape` (GeoJSON.Feature): The last drawn shape on the map.
 * - `spatialAnalysis` (SpatialAnalysisResult): The result of the spatial analysis.
 * - `onClose` (function): Callback function to handle closing the chat interface.
 * 
 * @note
 * - This component is designed to be used in a client-side context.
 * - It uses the `useRef` and `useState` hooks to manage state.
 * 
 * @usage
 * export default function YourFunction() {
 *  const MapChatIntegrationWithNoSSR = dynamic(
 *   () => import('./MapChatIntegration'),
 *   { ssr: false }
 *  )
 * }
 * 
 * <MapChatIntegrationWithNoSSR />
 */

'use client';
import { useRef, useState, useCallback } from 'react';
import TiltaksAidMap from './TiltaksAidMap';
import { PlanPrat } from './PlanChatAtlas';
import type { Map } from 'leaflet';
import type { SpatialAnalysisResult } from '~/utils/propertyUtils';
import { usePropertySearch } from '~/hooks/usePropertySearch';

export function MapChatIntegration() {
  const mapStateRef = useRef<{ map: Map | null; ready: boolean }>({ map: null, ready: false });
  const [mapReady, setMapReady] = useState(false); 
  const [lastDrawnShape, setLastDrawnShape] = useState<GeoJSON.Feature | null>(null);
  const [spatialAnalysis, setSpatialAnalysis] = useState<SpatialAnalysisResult | null>(null);
  
  const { userData } = usePropertySearch();
 
  const handleMapReady = useCallback((map: Map) => {
    if (mapStateRef.current.map) return;
    mapStateRef.current = { map, ready: true };
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
          mapRefFromStore={mapStateRef.current}
          lastDrawnShapeFromStore={lastDrawnShape}
          spatialAnalysisFromStore={spatialAnalysis}
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