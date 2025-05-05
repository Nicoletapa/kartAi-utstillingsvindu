"use client";
import { type ChangeEvent, useState, type KeyboardEvent, useEffect, useRef } from "react";
import { api } from "~/trpc/react";
import type { Map } from 'leaflet';
import type { SpatialAnalysisResult } from './TiltaksAidMap'; 
import { SendHorizonal } from 'lucide-react';
import { useSession } from "next-auth/react";
import { useChatStore, type ChatItem } from '~/store/chatStore'; 

interface PlanPratProps {
  mapRefFromStore?: { map: Map | null; ready: boolean };
  lastDrawnShapeFromStore?: GeoJSON.Feature | null;
  spatialAnalysisFromStore?: SpatialAnalysisResult | null;
  onClose: () => void;
  disableTopRightRadius?: boolean;
  disableBottomRightRadius?: boolean;
}

interface GuideButton {
  title: string;
  url: string;
  description?: string;
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
        console.error("Error accessing map in PlanPrat: ", error)
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
  }, [chatItems]);

  const handleSendMessage = () => {
    if (!isTyping && text.trim() !== "") {
      void handleSubmit();
      setText("");
    }
  }


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

  function getCoordinatesFromGeometry(geometry: GeoJSON.Geometry): GeoJSON.Position | GeoJSON.Position[] | GeoJSON.Position[][] | GeoJSON.Position[][][] | Array<{type: string; coordinates: unknown}> {
    switch (geometry.type) {
      case 'Point':
      case 'LineString':
      case 'Polygon':
      case 'MultiPoint':
      case 'MultiLineString':
      case 'MultiPolygon':
        return geometry.coordinates;
      case 'GeometryCollection':
        return geometry.geometries.map(g => ({
          type: g.type,
          coordinates: getCoordinatesFromGeometry(g)
        }));
      default:
        console.warn(`Unsupported geometry type encountered: ${(geometry as GeoJSON.Geometry).type}`);
        return [];
    }
  }


  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    setText(e.target.value);
  };

  const handleSubmit = async (): Promise<void> => {
    if (text.trim()) {
      const userMessage: ChatItem = { text: text, isUser: true };
      addMessage(userMessage); 
      const sendText = text;
      setText("");

      setIsTyping(true); 

      try {
        const response = await queryPlanprat(sendText);
        setIsTyping(false); 

        if (!response) {
           return;
        }

        const botMessage: ChatItem = {
          text: response.answer,
          isUser: false,
          guides: response.guides
        };
        addMessage(botMessage); 

      } catch (error) {
         setIsTyping(false); 
         console.error("Error in handleSubmit:", error);
         setError("An unexpected error occurred."); 
      }
    }
  };
  // ---------------------------------------------

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatText = (text: string): JSX.Element => {
    const paragraphs = text.split(/\n\n+/);
    const listItemRegex = /^[-*â€¢] /;

    return (
      <>
        {paragraphs.map((paragraph, idx) => {
          if (!paragraph.trim()) return null;
          const formattedText = paragraph.replace(
            /(\*\*|__)(.*?)\1/g,
            '<strong class="font-semibold">$2</strong>'
          );
          if (RegExp(/^[-*â€¢] /).exec(formattedText)) {
            return (
              <ul key={idx} className="list-disc ml-6 mb-3">
                {formattedText.split(/\n/).map((item, i) => {
                  const listItem = item.replace(listItemRegex, '');
                  if (!listItem.trim()) return null;
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
            <button
              key={index}
              onClick={() => window.open(guide.url, '_blank')}
              className="inline-flex items-center justify-between px-4 py-3 border border-blue-300 text-sm font-medium rounded-md shadow-sm text-blue-800 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
              type="button"
            >
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                {guide.title}
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            </button>
          ))}
        </div>
      </div>
    );
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
              {!chatItem.isUser && chatItem.guides && chatItem.guides.length > 0 && (
                renderGuideButtons(chatItem.guides)
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
