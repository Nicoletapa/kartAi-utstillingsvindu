"use client";
import { type ChangeEvent, useState, type KeyboardEvent, useEffect } from "react";
import Image from "next/image";
import { api } from "~/trpc/react";
import type { Map } from 'leaflet';
import type { SpatialAnalysisResult } from './TiltaksAidMap';

interface PlanPratProps {
  mapRef?: React.MutableRefObject<Map | null>;
  lastDrawnShape?: GeoJSON.Feature | null;
  spatialAnalysis?: SpatialAnalysisResult | null;
  mapReady?: boolean;
}
interface GuideButton {
  title: string;
  url: string;
  description?: string;
}


export function PlanPrat({ mapRef, lastDrawnShape, spatialAnalysis, mapReady = false }: PlanPratProps) {
  const [error, setError] = useState("");
  const [text, setText] = useState<string>("");
  const [chatItems, setChatItems] = useState<
    { text: string; isUser: boolean, guides?: GuideButton[] }[]
  >([]);
  const [shapeContext, setShapeContext] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const utils = api.useUtils();


  useEffect(() => {
    if (lastDrawnShape) {
      
      const shapeType = lastDrawnShape.geometry.type;
      let description = `I've drawn a ${shapeType.toLowerCase()} on the map.`;
    

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
      
      
      setChatItems((prevChatItems) => [
        { text: `System: ${description} Ask me about it!`, isUser: false },
        ...prevChatItems,
      ]);
    }
  }, [lastDrawnShape, spatialAnalysis]);


  useEffect(() => {
    if (mapRef?.current && mapReady) {
      console.log("Map center: ", mapRef.current.getCenter());
      // Can control the map here, e.g.,
    // mapRef.current.setView([latitude, longitude], zoom);
    }
  }, [mapRef, mapReady]);

  // Update the queryPlanprat function to include map information
  async function queryPlanprat(queryInput: string) {
    try {
      let enhancedQuery = queryInput;
      
      // Add drawn shape context if available
      if (lastDrawnShape) {
        const shapeSummary = {
          type: lastDrawnShape.geometry.type,
          coordinates: getCoordinatesFromGeometry(lastDrawnShape.geometry),
        };
        
        let spatialInfo = "";
        if (spatialAnalysis) {
          spatialInfo = `Spatial analysis: ${spatialAnalysis.isWithinProperty ? 
            'Shape is within property boundaries' : 
            `Shape is outside property boundaries by ${spatialAnalysis.distanceToProperty?.toFixed(2)} meters`}`;
          
          // Add property ID if available
          if (spatialAnalysis.nearestPropertyId) {
            spatialInfo += ` Property ID: ${spatialAnalysis.nearestPropertyId}`;
          }
        }
        
        enhancedQuery = `${queryInput} [Context: User has drawn on the map: ${JSON.stringify(shapeSummary)}. ${spatialInfo}]`;
      }
      
      // Add map view context if available
      if (mapRef?.current && mapReady) {
        const center = mapRef.current.getCenter();
        const zoom = mapRef.current.getZoom();
        enhancedQuery += ` [Map context: User is viewing map at coordinates ${center.lat.toFixed(5)}, ${center.lng.toFixed(5)}, zoom level ${zoom}]`;
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
      // Remove unnecessary type assertion
      return geometry.coordinates;
    } else if (geometry.type === 'LineString') {
      // Remove unnecessary type assertion
      return geometry.coordinates;
    } else if (geometry.type === 'Polygon') {
      // Remove unnecessary type assertion
      return geometry.coordinates;
    } else if (geometry.type === 'MultiPoint') {
      // Remove unnecessary type assertion
      return geometry.coordinates;
    } else if (geometry.type === 'MultiLineString') {
      // Remove unnecessary type assertion
      return geometry.coordinates;
    } else if (geometry.type === 'MultiPolygon') {
      // Remove unnecessary type assertion
      return geometry.coordinates;
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
      setLoading(true);
      try {
        const response = await queryPlanprat(sendText);
        if (response) {
          setChatItems((prevChatItems) => [
            { 
              text: response.answer, 
              isUser: false,
              guides: response.guides 
            },
            ...prevChatItems,
          ]);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to get a response. Please try again.");
      } finally {
        setLoading(false);
      }
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
  const renderGuideButtons = (guides: GuideButton[]) => {
    if (!guides || guides.length === 0) return null;
    
    return (
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="text-sm font-semibold mb-2 text-blue-800">Relevante veivisere:</h4>
        <div className="flex flex-col gap-2">
          {guides.map((guide, index) => (
            <a 
              key={index}
              href={guide.url}
              target="_blank"
              rel="noopener noreferrer" 
              className="inline-flex items-center justify-between px-4 py-3 border border-blue-300 text-sm font-medium rounded-md shadow-sm text-blue-800 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
            >
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                {guide.title}
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          ))}
        </div>
      </div>
    );
  };

  return (
    <section className="flex flex-col h-full">
      <h1 className="bg-kartAI-blue py-3 text-center text-white font-bold text-lg">
        PlanChat
      </h1>
      
      {/* Map context indicator with spatial information */}
      {mapReady && (
        <div className="bg-green-50 p-3 text-sm">
          {/* <span className="font-semibold">Map connected.</span>
          {shapeContext && (
            <div className="mt-1">
              <span className="italic">{shapeContext}</span>
            </div>
          )} */}
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
      )}
      
      <div className="flex-1 flex flex-col p-2 overflow-hidden">
        <ul
          id="planprat-output"
          className="flex-1 overflow-y-auto flex flex-col-reverse p-2 rounded-lg bg-gray-50"
        >
          {chatItems.map((chatItem, index) => (
            <li
              data-cy="chat-output"
              className={
                chatItem.isUser
                  ? "m-2 ml-6 self-end rounded-lg border-2 p-2 text-black shadow-md bg-white"
                  : "m-2 mr-6 self-start rounded-lg bg-kartAI-blue p-2 text-white shadow-md"
              }
              key={index}
            >
              {chatItem.text}
              {!chatItem.isUser && chatItem.guides && renderGuideButtons(chatItem.guides)}
            </li>
          ))}
        </ul>
        <div className="relative mt-2">
          <textarea
            id="planprat-input"
            className="w-full min-h-14 p-3 pr-12 rounded-lg border border-gray-300 focus:border-kartAI-blue focus:ring-1 focus:ring-kartAI-blue"
            placeholder="Still meg et spørsmål ..."
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            disabled={loading}
          ></textarea>
          <button
            type="submit"
            id="planprat-input-button"
            className={`absolute bottom-2 right-2 rounded-full p-2 bg-kartAI-blue hover:bg-kartAI-blue/90 transition-colors ${loading ? 'opacity-80' : ''}`}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Image
                src="/Ikoner/Dark/SVG/Comment.svg"
                alt="send"
                height="24"
                width="24"
                className="text-white"
              ></Image>
            )}
          </button>
        </div>
        {error && <p className="py-2 text-center text-red-500 text-sm">{error}</p>}
      </div>
    </section>
  );
}
