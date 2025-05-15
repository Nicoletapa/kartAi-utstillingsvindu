"use client";
import { type ChangeEvent, useState, type KeyboardEvent, useEffect, useRef } from "react";
import { api } from "~/trpc/react";
import type { Map } from 'leaflet';
import type { SpatialAnalysisResult } from './TiltaksAidMap'; 
import { SendHorizonal } from 'lucide-react';
import { useSession } from "next-auth/react";
import { useChatStore, type ChatItem } from '~/store/chatStore'; 
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

// It's good practice to define this component outside PlanPrat or in its own file.
// For this change, I'll modify it in place as per its current location.
interface TypewriterMarkdownProps {
  text: string;
  delayPerChar?: number; // Time in ms each character "takes" to appear
  skipAnimation?: boolean;
}

const TypewriterMarkdown: React.FC<TypewriterMarkdownProps> = ({
  text,
  delayPerChar = 20, // Default to 20ms per character
  skipAnimation = false,
}) => {
  const [displayedText, setDisplayedText] = useState(skipAnimation ? text : "");
  const animationFrameIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const currentIndexRef = useRef<number>(skipAnimation ? text.length : 0);

  useEffect(() => {
    // Always cancel any ongoing animation if props change before starting a new one
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }

    if (skipAnimation) {
      setDisplayedText(text);
      currentIndexRef.current = text.length;
      return;
    }

    // Reset for new animation if not skipping
    // (useState already handles initial "" if not skipping)
    // If text changes, we need to reset animation state.
    if (displayedText !== "" || currentIndexRef.current !== 0) {
        setDisplayedText("");
        currentIndexRef.current = 0;
    }
    startTimeRef.current = null; // Reset start time for the new animation

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp; // Initialize startTime on the first frame
      }

      const elapsedTime = timestamp - startTimeRef.current;
      const targetCharsToShow = Math.floor(elapsedTime / delayPerChar);

      if (currentIndexRef.current < text.length) {
        if (targetCharsToShow > currentIndexRef.current) {
          const newIndex = Math.min(targetCharsToShow, text.length);
          setDisplayedText(text.slice(0, newIndex));
          currentIndexRef.current = newIndex;
        }
      } else {
        // Animation complete, ensure full text is displayed
        if (displayedText !== text) {
          setDisplayedText(text);
        }
        animationFrameIdRef.current = null;
        return; // Stop animation
      }

      if (currentIndexRef.current < text.length) {
        animationFrameIdRef.current = requestAnimationFrame(animate);
      } else {
        // Ensure final text is set if loop finishes due to text.length
        if (displayedText !== text) {
            setDisplayedText(text);
        }
        animationFrameIdRef.current = null;
      }
    };

    // Start the animation only if there's text and not skipping
    if (text.length > 0) {
      animationFrameIdRef.current = requestAnimationFrame(animate);
    } else {
      setDisplayedText(""); // Handle empty text case
      currentIndexRef.current = 0;
    }

    return () => { // Cleanup
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  }, [text, delayPerChar, skipAnimation]); // Effect dependencies

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={{
        p: ({...props}) => <p className="my-2" {...props} />,
        ul: ({...props}) => <ul className="list-disc ml-5 my-2" {...props} />,
        li: ({...props}) => <li className="mb-1" {...props} />,
        a: ({...props}) => <a className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
        strong: ({...props}) => <strong className="font-semibold" {...props} />,
        h3: ({...props}) => <h3 className="text-lg font-bold mt-3 mb-2" {...props} />,
      }}
    >
      {displayedText}
    </ReactMarkdown>
  );
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
      return; 
    }
    
    if (text.trim()) {
      const userMessage: ChatItem = { text: text, isUser: true };
      addMessage(userMessage); 
      const sendText = text;
      setText("");

      setIsTyping(true); 

      try {
        
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

          {chatItems.map((chatItem, index) => {
            const isLastItem = index === chatItems.length - 1;
            const isBotMessage = !chatItem.isUser;
            // Animate only if it's the last message in the chat AND it's a bot message.
            // Otherwise, skip animation (display text immediately).
            const shouldAnimate = isBotMessage && isLastItem;

            return (
              <li
                data-cy="chat-output"
                className={
                  chatItem.isUser
                    ? "mb-4 ml-8 self-end rounded-lg p-2 text-black bg-gray-100 max-w-[80%]"
                    : "mb-4 mr-8 self-start rounded-lg bg-kartAI-lightblue bg-opacity-10 p-2 text-black max-w-[80%]"
                }
                key={chatItem.timestamp ?? index} 
              >
                {chatItem.isUser ? (
                  chatItem.text
                ) : (
                  <TypewriterMarkdown
                    text={chatItem.text}
                    skipAnimation={!shouldAnimate}
                    delayPerChar={15} // Adjust for desired speed (e.g., 15-30ms)
                  />
                )}
              
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
            );
          })}
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
