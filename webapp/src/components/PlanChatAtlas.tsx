"use client";
import { type ChangeEvent, useState, type KeyboardEvent, useEffect } from "react";
import { api } from "~/trpc/react";
import type { Map } from 'leaflet';
import type { SpatialAnalysisResult } from './TiltaksAidMap';
import { SendHorizonal } from 'lucide-react';
import { useSession } from "next-auth/react";
import ReactMarkdown from 'react-markdown';

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
  const { data: session } = useSession();
  const [error, setError] = useState("");
  const [text, setText] = useState<string>("");
  const [chatItems, setChatItems] = useState<
    { text: string; isUser: boolean, guides?: GuideButton[] }[]
  >([]);
  const [isTyping, setIsTyping] = useState(false);

  const utils = api.useUtils();

  // Legg til forhåndsdefinerte spørsmål
  const suggestedQuestions = [
    "Hvilke regler gjelder for å bygge garasje i Kristiansand?",
    "Kan jeg bygge terrasse uten å søke?",
    "Hva er reglene for boligbygging i strandsonen?"
  ];

  // Funksjon for å velge et foreslått spørsmål
  const handleSuggestedQuestion = (question: string) => {
    setText(question);
    // Alternativt kan du sende spørsmålet direkte:
    setText(question);
    handleSendMessage();
  };

  useEffect(() => {
    if (!lastDrawnShape) return;
    
    // Beskriv figuren
    const description = generateShapeDescription(lastDrawnShape, spatialAnalysis ?? undefined);
    
    setChatItems((prevChatItems) => [
      { text: `System: ${description} Ask me about it!`, isUser: false },
      ...prevChatItems,
    ]);
  }, [lastDrawnShape, spatialAnalysis]);

  // Helper function outside useEffect
  const generateShapeDescription = (shape: GeoJSON.Feature, analysis?: SpatialAnalysisResult) => {
    let description = `I've drawn a ${shape.geometry.type.toLowerCase()} on the map.`;
    
    // Legg til info om antall punkter
    if (shape.geometry.type === "Polygon" || shape.geometry.type === "LineString") {
      const coordsCount = Array.isArray(shape.geometry.coordinates[0]) 
        ? shape.geometry.coordinates[0].length 
        : shape.geometry.coordinates.length;
      description += ` It has ${coordsCount} points.`;
    }
    
    // Legg til info om romlig analyse
    if (analysis) {
      if (analysis.isWithinProperty) {
        description += ` The shape is within the property boundary.`;
      } else if (analysis.distanceToProperty !== null) {
        description += ` The shape is outside the property boundary by approximately ${analysis.distanceToProperty.toFixed(2)} meters.`;
      }
    }
    
    return description;
  };

  const handleSendMessage = async (): Promise<void> => {
    if (!isTyping && text.trim()) {
      const sendText = text;
      
      // Oppdater UI umiddelbart
      setChatItems((prevChatItems) => [
        { text: sendText, isUser: true },
        ...prevChatItems,
      ]); 
      setText("");
      
      setIsTyping(true);
      const response = await queryPlanprat(sendText);
      setIsTyping(false);
      
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
  }

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

  const shouldIncludeCoordinates = (query: string): boolean => {
    return containsPropertyReference(query) || 
           !!lastDrawnShape || 
           !!spatialAnalysis?.nearestPropertyId;
  };

  async function queryPlanprat(queryInput: string) {
    try {
      let enhancedQuery = queryInput;
      const includeCoordinates = shouldIncludeCoordinates(queryInput);
      
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
          
          if (spatialAnalysis.nearestPropertyId) {
            spatialInfo += ` Property ID: ${spatialAnalysis.nearestPropertyId}`;
          }
        }
        
        enhancedQuery = `${queryInput} [Context: User has drawn on the map: ${JSON.stringify(shapeSummary)}. ${spatialInfo}]`;
      }
      
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
      return null;
    }
  }

  function getCoordinatesFromGeometry(geometry: GeoJSON.Geometry): GeoJSON.Position | GeoJSON.Position[] | GeoJSON.Position[][] | GeoJSON.Position[][][] | Array<{type: string; coordinates: unknown}> {
    if (geometry.type === 'GeometryCollection') {
      return geometry.geometries.map(g => ({
        type: g.type,
        coordinates: getCoordinatesFromGeometry(g)
      }));
    }

    if ('coordinates' in geometry) {
      return geometry.coordinates;
    }
    
    return [];
  }

  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    setText(e.target.value);
  };

  

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderChatItem = (chatItem: { text: string; isUser: boolean; guides?: GuideButton[] }, index: number) => {
    
    const renderMarkdownLinks = () => (
      <ReactMarkdown
        components={{
          a: ({ children, ...props}) => (
            <a
              {...props}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-2.5 my-1  border border-kartAI-blue text-sm font-medium rounded-md shadow-sm text-white bg-kartAI-blue hover:bg-kartAI-lightblue focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-kartAI-blue transition-all group w-full "
            >
              <span className="flex-grow">{children}</span>
              <span className="flex-shrink-0 inline-flex ml-1.5 w-5 h-5 items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </span>
            </a>
          ),
          p: ({ ...props}) => <p className="mb-2" {...props} />,
        }}
      >
        {chatItem.text}
      </ReactMarkdown>
    );
    
    const renderGuideButtons = () => (
      !chatItem.isUser && chatItem.guides && chatItem.guides.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="text-sm font-semibold mb-2 text-blue-800">Relevante veivisere:</h4>
          <div className="flex flex-col gap-2">
            {chatItem.guides.map((guide, guideIndex) => (
              <button
                key={guideIndex}
                onClick={() => window.open(guide.url, '_blank', 'noopener,noreferrer')}
                className="inline-flex items-center justify-between px-4 py-3 border border-blue-300 text-sm font-medium rounded-md shadow-sm text-blue-800 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all text-left"
              >
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  {guide.title}
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      )
    );

    return (
      <li
        data-cy="chat-output"
        className={
          chatItem.isUser
            ? "mb-4 ml-8 self-end rounded-lg p-2 text-black bg-gray-100 max-w-[80%]"
            : "mb-4 mr-8 self-start rounded-lg bg-kartAI-lightblue bg-opacity-10 p-2 text-black max-w-[80%]"
        }
        key={index}
      >
        {renderMarkdownLinks()}
        {renderGuideButtons()}
      </li>
    );
  };

  return (
    <section className="rounded-l-lg shadow-lg h-[500px] flex flex-col overflow-hidden">
      <div className="w-full bg-kartAI-blue pb-3 pt-1 text-center text-white rounded-tl-lg flex-shrink-0">
        <h1>PlanChat</h1>
        
        {session && session.user && (
          <p className="text-sm font-medium">Din adresse: {session.user.address}</p>
        )}
      </div>

      <div id="planprat-input-output" className="relative w-full flex flex-col flex-1 overflow-hidden">
        <ul
          id="planprat-output"
          className="flex w-full flex-1 flex-col-reverse overflow-y-auto p-2"
        >
          {error && (
            <li className="m-2 mr-6 self-start rounded-lg bg-red-100 p-2 text-red-700 border border-red-500">
              {error}
            </li>
          )}

          {isTyping && (
            <li className="mb-4 mr-8 self-start rounded-lg bg-kartAI-lightblue bg-opacity-10 p-3 text-black flex items-center space-x-1">
              <span className="w-2 h-2 bg-gray-500 rounded-full opacity-0 animate-loadingFade"></span>
              <span className="w-2 h-2 bg-gray-500 rounded-full opacity-0 animate-[loadingFade_1s_infinite_200ms]"></span>
              <span className="w-2 h-2 bg-gray-500 rounded-full opacity-0 animate-[loadingFade_1s_infinite_400ms]"></span>
            </li>
          )}

          {/* Vis foreslåtte spørsmål når chatten er tom */}
          {chatItems.length === 0 && !isTyping && !error && (
            <li className="mb-4 mr-8 self-start rounded-lg bg-kartAI-lightblue bg-opacity-10 p-4 text-black w-full">
              <p className="font-medium mb-2">Hei! Her er noen forslag til hva du kan spørre meg om:</p>
              <div className="flex flex-col gap-2 mt-4">
                {suggestedQuestions.map((question, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestedQuestion(question)}
                    className="text-left px-4 py-3 border border-kartAI-blue text-sm font-medium rounded-md shadow-sm text-kartAI-blue bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-kartAI-blue transition-all"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </li>
          )}

          {chatItems.map((chatItem, index) => renderChatItem(chatItem, index))}
        </ul>
        
        <div className="relative w-full flex-shrink-0 p-2 border-t border-gray-200">
          <textarea
            id="planprat-input"
            className="w-full min-h-[3rem] max-h-[8rem] rounded-lg p-2 pr-12 text-black bg-gray-200 shadow-inner resize-y"
            placeholder="Still meg et spørsmål ..."
            value={text}
            onChange={handleTextChange}
            disabled={isTyping}
            onKeyDown={handleKeyDown}
            rows={2}
          ></textarea>

          <button
            type="submit"
            id="planprat-input-button"
            className="absolute bottom-2 right-2 p-2 rounded bg-transparent"
            onClick={handleSendMessage}
            disabled={isTyping || text.trim() === ""}
          >
            <SendHorizonal size={24} className="text-kartAI-blue hover:text-blue-800 duration-300 transition" />
          </button>
        </div>  
      </div>
    </section>
  );
}
