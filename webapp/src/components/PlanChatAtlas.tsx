"use client";
import { type ChangeEvent, useState, type KeyboardEvent, useEffect, useRef } from "react";
import { api } from "~/trpc/react";
import type { Map } from 'leaflet';
import type { SpatialAnalysisResult } from './TiltaksAidMap'; 
import { SendHorizonal } from 'lucide-react';
import { useSession } from "next-auth/react";
import { useChatStore, type ChatItem } from '~/store/chatStore'; 

// Helper function to apply bold formatting
const applyBold = (lineText: string): string =>
  lineText.replace(
    /(\*\*|__)(.*?)\1/g, // Matches **bold** or __bold__
    '<strong class="font-semibold">$2</strong>'
  );

// Helper function to check if a line is a list item
const isListItem = (lineText: string): boolean =>
  /^[-*•]\s+/.test(lineText); // Starts with -, *, or •, followed by one or more spaces

const formatText = (text: string): JSX.Element[] => {
  const outputElements: JSX.Element[] = [];
  if (!text?.trim()) {
    return outputElements; 
  }

  // Split the text into major blocks based on double newlines (paragraph breaks)
  const majorBlocks = text.split(/\n\n+/);

  majorBlocks.forEach((block, blockIdx) => {
    if (!block.trim()) return; // Skip empty blocks

    const lines = block.split('\n'); // Split each block into individual lines
    let currentParagraphLines: string[] = [];
    let currentListItems: string[] = [];

    // Function to flush (render) accumulated paragraph lines
    const flushParagraph = (key: string) => {
      if (currentParagraphLines.length > 0) {
        outputElements.push(
          <p
            key={`p-${key}`}
            className="my-2" // Add some vertical margin for paragraphs
            dangerouslySetInnerHTML={{ __html: currentParagraphLines.join('<br />') }}
          />
        );
        currentParagraphLines = [];
      }
    };

    // Function to flush (render) accumulated list items
    const flushList = (key: string) => {
      if (currentListItems.length > 0) {
        outputElements.push(
          <ul key={`ul-${key}`} className="list-disc ml-5 my-2"> {/* Standard list styling */}
            {currentListItems.map((item, itemIdx) => (
              <li
                key={`li-${key}-${itemIdx}`}
                className="mb-1" // Small margin below each list item
                dangerouslySetInnerHTML={{ __html: item.replace(/^[-*•]\s+/, '') }} // Remove marker before rendering
              />
            ))}
          </ul>
        );
        currentListItems = [];
      }
    };

    lines.forEach((line, lineIdx) => {
      // Apply bolding to the line content, preserve original line for structural checks if needed
      const boldedLine = applyBold(line); 
      const trimmedLineForCheck = line.trim(); // Use a trimmed version for structural checks

      if (!trimmedLineForCheck) {
        // If an effectively empty line is encountered, it can act as a break.
        // Flush existing paragraph or list.
        flushParagraph(`block-${blockIdx}-line-${lineIdx}-empty-p`);
        flushList(`block-${blockIdx}-line-${lineIdx}-empty-ul`);
        return; // Continue to the next line
      }

      if (isListItem(trimmedLineForCheck)) {
        flushParagraph(`block-${blockIdx}-line-${lineIdx}-p`); // If starting a list, finish current paragraph
        currentListItems.push(boldedLine); // Add the original (now bolded) line to list items
      } else {
        flushList(`block-${blockIdx}-line-${lineIdx}-ul`); // If starting a paragraph, finish current list
        currentParagraphLines.push(boldedLine); // Add to paragraph lines
      }
    });

    // After processing all lines in a block, flush any remaining content
    flushParagraph(`block-${blockIdx}-final-p`);
    flushList(`block-${blockIdx}-final-ul`);
  });

  return outputElements;
};

interface PlanPratProps {
  mapRefFromStore?: { map: Map | null; ready: boolean };
  lastDrawnShapeFromStore?: GeoJSON.Feature | null;
  spatialAnalysisFromStore?: SpatialAnalysisResult | null;
  onClose: () => void;
  disableTopRightRadius?: boolean;
  disableBottomRightRadius?: boolean;
}

export function PlanPrat({
  mapRefFromStore,
  lastDrawnShapeFromStore,
  spatialAnalysisFromStore,
  disableBottomRightRadius,
  disableTopRightRadius
}: PlanPratProps) {
  const { data: session } = useSession();
  const [text, setText] = useState<string>("");
  const utils = api.useUtils();
  const mapCenterLogged = useRef(false);

  // --- State and actions from the store ---
  const {
    chatItems,
    isTyping,
    error,
    addMessage,
    setIsTyping,
    setError,
  } = useChatStore();
  const lastDrawnShape = lastDrawnShapeFromStore;
  const spatialAnalysis = spatialAnalysisFromStore;
  // ------------------------------------------

  // Handle sending messages when user clicks send button
  const handleSendMessage = () => {
    if (!isTyping && text.trim() !== "") {
      void handleSubmit();
      setText("");
    }
  };

  useEffect(() => {
    if (lastDrawnShape) {
      const shapeType = lastDrawnShape.geometry.type;
      let description = `I've drawn a ${shapeType.toLowerCase()} on the map.`;

      if (['Polygon', 'LineString', 'MultiPoint', 'MultiLineString', 'MultiPolygon'].includes(shapeType)) {
          description += ` It involves multiple coordinates.`;
      }

      if (spatialAnalysis) {
        if (spatialAnalysis.isWithinProperty) {
          description += ` The shape is within the property boundary.`;
        } else if (spatialAnalysis.distanceToProperty !== null) {
          description += ` The shape is outside the property boundary by approximately ${spatialAnalysis.distanceToProperty.toFixed(2)} meters.`;
        }
      }

      const systemMessageExists = chatItems.some(item => !item.isUser && item.text.startsWith("System:") && item.text.includes(description));

      if (!systemMessageExists) {
          addMessage({ text: `System: ${description} Ask me about it!`, isUser: false });
      }
    }
  }, [lastDrawnShape, spatialAnalysis, addMessage, chatItems]);


  useEffect(() => {
    const mapReady = mapRefFromStore?.ready ?? false;
    const map = mapRefFromStore?.map ?? null;

    if (mapReady && map && !mapCenterLogged.current) {
      try {
        const center = map.getCenter?.();
        if (center) {
          console.log("Map center (from PlanPrat): ", center);
          mapCenterLogged.current = true;
        }
      } catch (error) {
        console.error("Error accessing map in PlanPrat: ", error);
      }
    }
  }, [mapRefFromStore]); 

  useEffect(() => {
    if (chatItems.length > 0 && chatItems[0]?.isUser === false) { 
      setIsTyping(true);
      const typingTimeout = setTimeout(() => {
        setIsTyping(false);
      }, 0); 
      return () => clearTimeout(typingTimeout);
    }
  }, [chatItems, setIsTyping]);

  const containsPropertyReference = (text: string): boolean => {
    const patterns = {
      gnr: /g(?:Ã¥r)?d?s?n(?:umme)?r\.?(?:\s+)?(?:nr\.?)?(?:\s+)?(\d+)/i,
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

  function getCoordinatesFromGeometry(geometry: GeoJSON.Geometry): GeoJSON.Position | GeoJSON.Position[] | GeoJSON.Position[][] | GeoJSON.Position[][][] | Array<{type: string; coordinates: unknown}> {
    switch (geometry.type) {
      case 'Point':
        return (geometry ).coordinates;
      case 'LineString':
        return (geometry ).coordinates;
      case 'Polygon':
        return (geometry ).coordinates;
      case 'MultiPoint':
        return (geometry ).coordinates;
      case 'MultiLineString':
        return (geometry ).coordinates;
      case 'MultiPolygon':
        return (geometry ).coordinates;
      case 'GeometryCollection':
        return (geometry ).geometries.map(g => ({
          type: g.type,
          coordinates: getCoordinatesFromGeometry(g)
        }));
      default:
        console.warn(`Unsupported geometry type encountered: ${(geometry as GeoJSON.Geometry).type}`);
        return [];
    }
  }

  async function queryPlanprat(queryInput: string) {
    try {
      let enhancedQuery = queryInput;
      const includeCoordinates = shouldIncludeCoordinates(queryInput);
      const mapReady = mapRefFromStore?.ready ?? false;
      const map = mapRefFromStore?.map ?? null;

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

      if (mapReady && map && includeCoordinates) {
        const center = map.getCenter?.();
        const zoom = map.getZoom?.();
        if (center) {
          enhancedQuery += ` [Map context: User is viewing map at coordinates ${center.lat.toFixed(5)}, ${center.lng.toFixed(5)}, zoom level ${zoom}]`;
        }
      }

      const response = await utils.planprat.fetchResponse.fetch({
        query: enhancedQuery,
      });
      return response;
    } catch (error) {
      console.error(error);
      setError("Error: Failed to retrieve response."); 
      return undefined;
    }
  }
  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    setText(e.target.value);
  };

  const handleSubmit = async (): Promise<void> => {
    if (isTyping) {
      return; // Don't allow submissions while already processing
    }
    
    if (text.trim()) {
      const userMessage: ChatItem = { text: text, isUser: true };
      addMessage(userMessage); 
      const sendText = text;
      setText("");

      setIsTyping(true); 

      try {
        // Create a comprehensive payload with detailed spatial data
        const payload = {
          text: sendText,
          spatialData: spatialAnalysisFromStore ? {
            shapeType: lastDrawnShapeFromStore?.geometry.type ?? 'unknown',
            coordinates: lastDrawnShapeFromStore ? 
              getCoordinatesFromGeometry(lastDrawnShapeFromStore.geometry) : 
              [],
            isWithinProperty: Boolean(spatialAnalysisFromStore.isWithinProperty),
            distanceToProperty: spatialAnalysisFromStore.distanceToProperty ?? null,
            nearestPropertyId: spatialAnalysisFromStore.nearestPropertyId ?? null,
            isWithinAllowedArea: spatialAnalysisFromStore.isWithinAllowedArea ?? null,
        
            distanceToNeighborProperty: spatialAnalysisFromStore.distanceToNeighborProperty ?? null,
            neighborPropertyId: spatialAnalysisFromStore.neighborPropertyId ?? null,
            distanceToRoad: spatialAnalysisFromStore.distanceToRoad ?? null,
            roadType: spatialAnalysisFromStore.roadType ?? null,
            buildingSize: spatialAnalysisFromStore.buildingSize ?? null
          } : null
        };

        const response = await queryPlanprat(payload.text);
        setIsTyping(false); 

        if (!response) {
          return;
        }

        // Check for error responses
        if (response.error) {
          console.error("API error:", response.error);
          setError(typeof response.error === 'string' ? response.error : "An error occurred");
          return;
        }

        console.log("Response from API:", response);
        console.log("Response guides:", response.guides);

        const botMessage: ChatItem = {
          text: response.answer,
          isUser: false,
          guides: Array.isArray(response.guides) ? response.guides : []
        };
        
        addMessage(botMessage);
      } catch (error) {
        setIsTyping(false); 
        console.error("Error in handleSubmit:", error);
        setError("An unexpected error occurred."); 
      }
    }
  };
  
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={`bg-white h-[500px] flex flex-col shadow-lg
      rounded-tl-lg
      ${disableTopRightRadius ? '' : 'rounded-tr-lg'}
      ${disableBottomRightRadius ? '' : 'rounded-br-lg'}
      rounded-bl-lg`}>
      <div className={`w-full bg-kartAI-blue shadow-lg pb-3 pt-1 text-center text-white rounded-tl-lg ${
        disableTopRightRadius ? '' : 'rounded-tr-lg'
      }`}>
        <h1>Chat</h1>
        {session?.user && (
          <p className="text-sm font-medium">Din adresse: {session.user.address}</p>
        )}
      </div>

      <div id="planprat-input-output" className="relative w-full p-2 flex-1 flex flex-col" style={{ height: "calc(100% - 3rem)" }}>
        <ul
          id="planprat-output"
          className="flex w-full flex-grow overflow-y-auto flex-col-reverse mb-2"
          style={{ height: "calc(100% - 5rem)" }}
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

          {chatItems.map((chatItem, index) => (
            <li
              data-cy="chat-output"
              className={
                chatItem.isUser
                  ? "mb-4 ml-8 self-end rounded-lg p-2 text-black bg-gray-100 max-w-[80%]"
                  : "mb-4 mr-8 self-start rounded-lg bg-kartAI-lightblue bg-opacity-10 p-2 text-black max-w-[80%]"
              }
              key={chatItem.timestamp ?? index} 
            >
              {chatItem.isUser ? chatItem.text : formatText(chatItem.text)}
              {!chatItem.isUser && chatItem.guides && Array.isArray(chatItem.guides) && chatItem.guides.length > 0 && (
                <div className="mt-2 flex flex-col gap-2">
                  {chatItem.guides.map((guide, guideIndex) => (
                    <a
                      key={guideIndex}
                      href={guide.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-left inline-block px-3 py-2 bg-white border border-blue-200 rounded-md hover:bg-blue-50 text-blue-700 transition-all shadow-sm mb-1"
                    >
                      <span className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        {guide.title}
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
        <div className="relative w-full mt-auto">
          <textarea
            id="planprat-input"
            className="w-full min-h-[4rem] max-h-[10rem] rounded-lg p-2 pr-12 text-black bg-gray-200 shadow-inner resize-y"
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
            className="absolute bottom-2 right-2 p-2 rounded bg-transparent disabled:opacity-50"
            onClick={handleSendMessage}
            aria-label="Send message"
          >
            <SendHorizonal size={24} className="text-kartAI-blue hover:text-blue-800 duration-300 transition" />
          </button>
        </div>
      </div>
    </div>
  );
}
