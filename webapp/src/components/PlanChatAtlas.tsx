"use client";
import { type ChangeEvent, useState, type KeyboardEvent, useEffect } from "react";
import Image from "next/image";
import { api } from "~/trpc/react";
import type { Map } from 'leaflet';
import type { SpatialAnalysisResult } from './TiltaksAidMap';
import { SendHorizonal } from "lucide-react";

interface PlanPratProps {
  mapRef?: React.MutableRefObject<Map | null>;
  lastDrawnShape?: GeoJSON.Feature | null;
  spatialAnalysis?: SpatialAnalysisResult | null;
  mapReady?: boolean;
}

export function PlanPrat({ mapRef, lastDrawnShape, spatialAnalysis, mapReady = false }: PlanPratProps) {
  const [error, setError] = useState("");
  const [text, setText] = useState<string>("");
  const [chatItems, setChatItems] = useState<
    { text: string; isUser: boolean }[]
  >([]);
  const [shapeContext, setShapeContext] = useState<string | null>(null);
  const utils = api.useUtils();

  // Monitor for changes in the drawn shape and spatial analysis
  useEffect(() => {
    if (lastDrawnShape) {
      // Create a human-readable description of the shape
      const shapeType = lastDrawnShape.geometry.type;
      let description = `I've drawn a ${shapeType.toLowerCase()} on the map.`;
      
      // Add coordinates info in a simplified format
      if (shapeType === "Polygon" || shapeType === "LineString") {
        const coordsCount = Array.isArray(lastDrawnShape.geometry.coordinates[0]) 
          ? lastDrawnShape.geometry.coordinates[0].length 
          : lastDrawnShape.geometry.coordinates.length;
        description += ` It has ${coordsCount} points.`;
      }
      
      // Add spatial analysis information if available
      if (spatialAnalysis) {
        if (spatialAnalysis.isWithinProperty) {
          description += ` The shape is within the property boundary.`;
        } else if (spatialAnalysis.distanceToProperty !== null) {
          description += ` The shape is outside the property boundary by approximately ${spatialAnalysis.distanceToProperty.toFixed(2)} meters.`;
        }
      }
      
      setShapeContext(description);
      
      // Notify in chat about the new shape with spatial information
      setChatItems((prevChatItems) => [
        { text: `System: ${description} Ask me about it!`, isUser: false },
        ...prevChatItems,
      ]);
    }
  }, [lastDrawnShape, spatialAnalysis]);

  // Use mapRef when needed
  useEffect(() => {
    if (mapRef?.current && mapReady) {
      console.log("Map center: ", mapRef.current.getCenter());
    }
  }, [mapRef, mapReady]);

  async function queryPlanprat(queryInput: string) {
    try {
      // Include information about the map context in the query
      let enhancedQuery = queryInput;
      
      if (lastDrawnShape) {
        // Create a condensed version of the shape for the query
        const shapeSummary = {
          type: lastDrawnShape.geometry.type,
          // Type-guard to safely handle different geometry types
          coordinates: getCoordinatesFromGeometry(lastDrawnShape.geometry),
        };
        
        // Add spatial analysis if available
        let spatialInfo = "";
        if (spatialAnalysis) {
          spatialInfo = `Spatial analysis: ${spatialAnalysis.isWithinProperty ? 
            'Shape is within property boundaries' : 
            `Shape is outside property boundaries by ${spatialAnalysis.distanceToProperty?.toFixed(2)} meters`}`;
        }
        
        enhancedQuery = `${queryInput} [Context: User has drawn on the map: ${JSON.stringify(shapeSummary)}. ${spatialInfo}]`;
      }
      
      const response = await utils.planprat.fetchResponse.fetch({
        query: enhancedQuery,
      });

      return response;
    } catch (error) {
      console.error(error);
      setError("Error: Failed to retrieve response.");
    }
  }

  // Helper function to safely extract coordinates from various geometry types
  function getCoordinatesFromGeometry(geometry: GeoJSON.Geometry): GeoJSON.Position | GeoJSON.Position[] | GeoJSON.Position[][] | GeoJSON.Position[][][] | Array<{type: string; coordinates: unknown}> {
    if (geometry.type === 'GeometryCollection') {
      // For GeometryCollection, return an array of geometries
      return geometry.geometries.map(g => ({
        type: g.type,
        coordinates: getCoordinatesFromGeometry(g)
      }));
    } else if (geometry.type === 'Point') {
      return (geometry as GeoJSON.Point).coordinates;
    } else if (geometry.type === 'LineString') {
      return (geometry as GeoJSON.LineString).coordinates;
    } else if (geometry.type === 'Polygon') {
      return (geometry as GeoJSON.Polygon).coordinates;
    } else if (geometry.type === 'MultiPoint') {
      return (geometry as GeoJSON.MultiPoint).coordinates;
    } else if (geometry.type === 'MultiLineString') {
      return (geometry as GeoJSON.MultiLineString).coordinates;
    } else if (geometry.type === 'MultiPolygon') {
      return (geometry as GeoJSON.MultiPolygon).coordinates;
    } else {
      // Default case - should never happen with valid GeoJSON
      return [];
    }
  }

  // Rest of the component code stays the same
  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    setText(e.target.value);
  };

  const handleSubmit = async (): Promise<void> => {
    if (text.trim()) {
      setChatItems((prevChatItems) => [
        { text: text, isUser: true },
        ...prevChatItems,
      ]); //question
      const sendText = text;
      setText("");
      const response = await queryPlanprat(sendText);
      if (!response) return;
      setChatItems((prevChatItems) => [
        { text: response.answer, isUser: false },
        ...prevChatItems,
      ]);
    }
  };

  const handleKeyDown = async (
    e: KeyboardEvent<HTMLTextAreaElement>,
  ): Promise<void> => {
    if (e.key === "Enter") {
      e.preventDefault();
      await handleSubmit();
    }
  };
  
  return (
    <section className="rounded-l-lg shadow-lg min-h-[500px]">
      <div className="w-full bg-kartAI-blue pb-3 pt-1 text-center text-white rounded-tl-lg">
        <h1>PlanChat</h1>
        <p className="text-sm font-medium">Din adresse: [placeholder]</p>
      </div>
      
      
      {/* Map context indicator with spatial information */}
      {/* {mapReady && (
        <div className="bg-green-100 p-2 text-sm">
          <span className="font-semibold">Map connected.</span>
          {shapeContext && (
            <div className="mt-1">
              <span className="italic">{shapeContext}</span>
            </div>
          )}
          {spatialAnalysis && (
            <div className={`mt-2 p-2 rounded-md ${
              spatialAnalysis.isWithinProperty 
                ? 'bg-green-100 border-l-4 border-green-500' 
                : 'bg-red-100 border-l-4 border-red-500'
            }`}>
              <div className="font-bold mb-1">
                {spatialAnalysis.isWithinProperty 
                  ? '✅ Drawing is within property boundaries' 
                  : '❌ Drawing is outside property boundaries'}
              </div>
              
              {!spatialAnalysis.isWithinProperty && spatialAnalysis.distanceToProperty && (
                <div>
                  Distance to property: <span className="font-semibold">{spatialAnalysis.distanceToProperty.toFixed(2)} meters</span>
                </div>
              )}
              
              {spatialAnalysis.nearestPropertyId && (
                <div>
                  Property ID: <span className="font-semibold">{spatialAnalysis.nearestPropertyId}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )} */}
      
      <div id="planprat-input-output" className="relative w-full p-2">
        <ul
          id="planprat-output"
          className="flex w-full flex-1 h-80 max-h-[80vh] flex-col-reverse overflow-y-auto p-2"
        >
          {error && (
            <li className="m-2 mr-6 self-start rounded-lg bg-red-100 p-2 text-red-700 border border-red-500">
              {error}
            </li>
          )}

          
          {chatItems.map((chatItem, index) => (
            <li
              data-cy="chat-output"
              className={
                chatItem.isUser
                  ? "m-2 ml-6 self-end rounded-lg p-2 text-black bg-gray-100"
                  : "m-2 mr-6 self-start rounded-lg bg-kartAI-blue bg-opacity-20 p-2 text-black"
              }
              key={index}
            >
              {chatItem.text}
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2 mt-2 mb-2">
          <textarea
          id="planprat-input"
          className="mt-2 w-full min-h-20 rounded-lg p-2 pr-12 text-black bg-gray-200 shadow-inner"
          placeholder="Still meg et spørsmål ..."
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
        ></textarea>
        <button
          type="submit"
          id="planprat-input-button"
          className="self-end right-8 rounded"
          onClick={handleSubmit}
        >
          <SendHorizonal size={24} className="text-kartAI-blue"/>
        </button>
        </div>
        
      </div>
    </section>
  );
}
