"use client";
import { type ChangeEvent, useState, type KeyboardEvent, useEffect, useRef } from "react";
import { api } from "~/trpc/react";
import type { Map } from 'leaflet';
import type { SpatialAnalysisResult } from './TiltaksAidMap';
import { SendHorizonal } from 'lucide-react';

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
  const utils = api.useUtils();
  const mapCenterLogged = useRef(false);

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
    if (mapRef?.current && mapReady && !mapCenterLogged.current) {
      console.log("Map center: ", mapRef.current.getCenter());
      mapCenterLogged.current = true;
      // Can control the map here, e.g.,
      // mapRef.current.setView([latitude, longitude], zoom);
    }
  }, [mapRef, mapReady]);

 
  const containsPropertyReference = (text: string): boolean => {
    
    const patterns = {
    
      gnr: /g(?:år)?d?s?n(?:umme)?r\.?(?:\s+)?(?:nr\.?)?(?:\s+)?(\d+)/i,
      bnr: /b(?:ruk)?s?n(?:umme)?r\.?(?:\s+)?(?:nr\.?)?(?:\s+)?(\d+)/i,
      snr: /s(?:eksjon)?s?n(?:umme)?r\.?(?:\s+)?(?:nr\.?)?(?:\s+)?(\d+)/i,
      
   
      combined: /(\d+)\/(\d+)(?:\/(?:0\/)?(\d+))?/,
      
      
      propertyTerms: /\b(eiendom|tomt|adresse|eiendommen min|min eiendom)\b/i
    };
    
    return Object.values(patterns).some(pattern => pattern.test(text));
  };

  // Function to check if coordinates should be included
  const shouldIncludeCoordinates = (query: string): boolean => {
    // Include coordinates if:
    // 1. Query mentions property references
    // 2. User has drawn a shape on the map
    // 3. Spatial analysis data is available
    return containsPropertyReference(query) || 
           !!lastDrawnShape || 
           !!spatialAnalysis?.nearestPropertyId;
  };

  // Update the queryPlanprat function
  async function queryPlanprat(queryInput: string) {
    try {
      let enhancedQuery = queryInput;
      const includeCoordinates = shouldIncludeCoordinates(queryInput);
      
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
      
      // Add map view context ONLY if property-related
      if (mapRef?.current && mapReady && includeCoordinates) {
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

  
  function getCoordinatesFromGeometry(geometry: GeoJSON.Geometry): GeoJSON.Position | GeoJSON.Position[] | GeoJSON.Position[][] | GeoJSON.Position[][][] | Array<{type: string; coordinates: unknown}> {
    if (geometry.type === 'GeometryCollection') {
     
      return geometry.geometries.map(g => ({
        type: g.type,
        coordinates: getCoordinatesFromGeometry(g)
      }));
    } else if (geometry.type === 'Point') {
      
      return geometry.coordinates;
    } else if (geometry.type === 'LineString') {
      
      return geometry.coordinates;
    } else if (geometry.type === 'Polygon') {
      
      return geometry.coordinates;
    } else if (geometry.type === 'MultiPoint') {
      
      return geometry.coordinates;
    } else if (geometry.type === 'MultiLineString') {
      
      return geometry.coordinates;
    } else if (geometry.type === 'MultiPolygon') {
      
      return geometry.coordinates;
    } else {
      
      return [];
    }
  }

  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    setText(e.target.value);
  };

  const handleSubmit = async (): Promise<void> => {
    if (text.trim()) {
      setChatItems((prevChatItems) => [
        { text: text, isUser: true },
        ...prevChatItems,
      ]); 
      const sendText = text;
      setText("");
      const response = await queryPlanprat(sendText);
      if (!response) return;
      setChatItems((prevChatItems) => [
        { 
          text: response.answer, 
          isUser: false,
          guides: response.guides 
        },
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

  // Format text with markdown-like syntax using Tailwind classes
  const formatText = (text: string): JSX.Element => {
    // Split the text into paragraphs
    const paragraphs = text.split(/\n\n+/);
    
    return (
      <>
        {paragraphs.map((paragraph, idx) => {
          if (!paragraph.trim()) return null;
          
          // Process bold text - ** or __ for bold
          const formattedText = paragraph.replace(
            /(\*\*|__)(.*?)\1/g, 
            '<strong class="font-semibold">$2</strong>'
          );
          
          // Check if this is a list item
          if (formattedText.match(/^[-*•] /)) {
            return (
              <ul key={idx} className="list-disc ml-6 mb-3">
                {formattedText.split(/\n/).map((item, i) => {
                  const listItem = item.replace(/^[-*•] /, '');
                  return <li key={i} className="mb-1" dangerouslySetInnerHTML={{ __html: listItem }} />;
                })}
              </ul>
            );
          }
          
          return <p key={idx} className="mb-3" dangerouslySetInnerHTML={{ __html: formattedText }} />;
        })}
      </>
    );
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
