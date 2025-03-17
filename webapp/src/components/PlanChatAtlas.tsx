"use client";
import { type ChangeEvent, useState, type KeyboardEvent, useEffect, useRef } from "react";
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
    <section className="flex flex-col h-full">
      <h1 className="bg-kartAI-blue py-3 text-center text-white font-bold text-lg">
        PlanChat
      </h1>
      
      {/* Map context indicator with spatial information */}
      {mapReady && (
        <div className="bg-green-50 p-3 text-sm">
          
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
              {chatItem.isUser ? (
                chatItem.text
              ) : (
                <div>
                  {formatText(chatItem.text)}
                  {chatItem.guides && renderGuideButtons(chatItem.guides)}
                </div>
              )}
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
          ></textarea>
          <button
            type="submit"
            id="planprat-input-button"
            className="absolute bottom-2 right-2 rounded-full p-2 bg-kartAI-blue hover:bg-kartAI-blue/90 transition-colors"
            onClick={handleSubmit}
          >
            <Image
              src="/Ikoner/Dark/SVG/Comment.svg"
              alt="send"
              height="24"
              width="24"
              className="text-white"
            ></Image>
          </button>
        </div>
        {error && <p className="py-2 text-center text-red-500 text-sm">{error}</p>}
      </div>
    </section>
  );
}
