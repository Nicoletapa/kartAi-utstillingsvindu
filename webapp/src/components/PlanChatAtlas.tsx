"use client";
import {
  type ChangeEvent,
  useState,
  type KeyboardEvent,
  useEffect,
  useRef,
} from "react";
import { api } from "~/trpc/react";
import type { Map } from "leaflet";
import type { SpatialAnalysisResult } from "./TiltaksAidMap";
import { SendHorizonal } from "lucide-react";
import { useSession } from "next-auth/react";
import { useChatStore, type ChatItem, type Guide } from "~/store/chatStore";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

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
  disableTopRightRadius,
}: PlanPratProps) {
  const { data: session } = useSession();
  const [text, setText] = useState<string>("");
  const utils = api.useUtils();
  const mapCenterLogged = useRef(false);

  // --- State and actions from the store ---
  const { chatItems, isTyping, error, addMessage, setIsTyping, setError } =
    useChatStore();
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

      if (
        [
          "Polygon",
          "LineString",
          "MultiPoint",
          "MultiLineString",
          "MultiPolygon",
        ].includes(shapeType)
      ) {
        description += ` It involves multiple coordinates.`;
      }

      if (spatialAnalysis) {
        if (spatialAnalysis.isWithinProperty) {
          description += ` The shape is within the property boundary.`;
        } else if (spatialAnalysis.distanceToProperty !== null) {
          description += ` The shape is outside the property boundary by approximately ${spatialAnalysis.distanceToProperty.toFixed(2)} meters.`;
        }
      }

      const systemMessageExists = chatItems.some(
        (item) =>
          !item.isUser &&
          item.text.startsWith("System:") &&
          item.text.includes(description),
      );

      if (!systemMessageExists) {
        addMessage({
          text: `System: ${description} Ask me about it!`,
          isUser: false,
        });
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
      propertyTerms: /\b(eiendom|tomt|adresse|eiendommen min|min eiendom)\b/i,
    };
    return Object.values(patterns).some((pattern) => pattern.test(text));
  };

  const shouldIncludeCoordinates = (query: string): boolean => {
    return (
      containsPropertyReference(query) ||
      !!lastDrawnShape ||
      !!spatialAnalysis?.nearestPropertyId
    );
  };

  function getCoordinatesFromGeometry(
    geometry: GeoJSON.Geometry,
  ):
    | GeoJSON.Position
    | GeoJSON.Position[]
    | GeoJSON.Position[][]
    | GeoJSON.Position[][][]
    | Array<{ type: string; coordinates: unknown }> {
    switch (geometry.type) {
      case "Point":
        return geometry.coordinates;
      case "LineString":
        return geometry.coordinates;
      case "Polygon":
        return geometry.coordinates;
      case "MultiPoint":
        return geometry.coordinates;
      case "MultiLineString":
        return geometry.coordinates;
      case "MultiPolygon":
        return geometry.coordinates;
      case "GeometryCollection":
        return geometry.geometries.map((g) => ({
          type: g.type,
          coordinates: getCoordinatesFromGeometry(g),
        }));
      default:
        console.warn(
          `Unsupported geometry type encountered: ${(geometry as GeoJSON.Geometry).type}`,
        );
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
          spatialInfo = `Spatial analysis: ${
            spatialAnalysis.isWithinProperty
              ? "Shape is within property boundaries"
              : `Shape is outside property boundaries by ${spatialAnalysis.distanceToProperty?.toFixed(2)} meters`
          }`;
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
          spatialData: spatialAnalysisFromStore
            ? {
                shapeType: lastDrawnShapeFromStore?.geometry.type ?? "unknown",
                coordinates: lastDrawnShapeFromStore
                  ? getCoordinatesFromGeometry(lastDrawnShapeFromStore.geometry)
                  : [],
                isWithinProperty: Boolean(
                  spatialAnalysisFromStore.isWithinProperty,
                ),
                distanceToProperty:
                  spatialAnalysisFromStore.distanceToProperty ?? null,
                nearestPropertyId:
                  spatialAnalysisFromStore.nearestPropertyId ?? null,
                isWithinAllowedArea:
                  spatialAnalysisFromStore.isWithinAllowedArea ?? null,

                distanceToNeighborProperty:
                  spatialAnalysisFromStore.distanceToNeighborProperty ?? null,
                neighborPropertyId:
                  spatialAnalysisFromStore.neighborPropertyId ?? null,
                distanceToRoad: spatialAnalysisFromStore.distanceToRoad ?? null,
                roadType: spatialAnalysisFromStore.roadType ?? null,
                buildingSize: spatialAnalysisFromStore.buildingSize ?? null,
              }
            : null,
        };

        const response = await queryPlanprat(payload.text);
        setIsTyping(false);

        if (!response) {
          return;
        }

        if (response.error) {
          console.error("API error:", response.error);
          setError(
            typeof response.error === "string"
              ? response.error
              : "An error occurred",
          );
          return;
        }

        console.log("Response from API:", response);
        console.log("Response guides:", response.guides);
        console.log("Response original_header:", response.original_header);

        const botMessage: ChatItem = {
          text: response.answer,
          isUser: false,
          guides: Array.isArray(response.guides) ? response.guides : [],
          original_header: response.original_header ?? undefined,
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
    <div
      className={`flex h-[500px] flex-col rounded-tl-lg bg-white shadow-lg ${disableTopRightRadius ? "" : "rounded-tr-lg"} ${disableBottomRightRadius ? "" : "rounded-br-lg"} rounded-bl-lg`}
    >
      <div
        className={`w-full rounded-tl-lg bg-kartAI-blue pb-3 pt-1 text-center text-white shadow-lg ${
          disableTopRightRadius ? "" : "rounded-tr-lg"
        }`}
      >
        <h1>Chat</h1>
        {session?.user && (
          <p className="text-sm font-medium">
            Din adresse: {session.user.address}
          </p>
        )}
      </div>

      <div
        id="planprat-input-output"
        className="relative flex w-full flex-1 flex-col p-2"
        style={{ height: "calc(100% - 3rem)" }}
      >
        <ul
          id="planprat-output"
          className="mb-2 flex w-full flex-grow flex-col-reverse overflow-y-auto"
          style={{ height: "calc(100% - 5rem)" }}
        >
          {error && (
            <li className="m-2 mr-6 self-start rounded-lg border border-red-500 bg-red-100 p-2 text-red-700">
              {error}
            </li>
          )}

          {isTyping && (
            <li className="mb-4 mr-8 flex items-center space-x-1 self-start rounded-lg bg-kartAI-lightblue bg-opacity-10 p-3 text-black">
              <span className="h-2 w-2 animate-loadingFade rounded-full bg-gray-500 opacity-0"></span>
              <span className="h-2 w-2 animate-[loadingFade_1s_infinite_200ms] rounded-full bg-gray-500 opacity-0"></span>
              <span className="h-2 w-2 animate-[loadingFade_1s_infinite_400ms] rounded-full bg-gray-500 opacity-0"></span>
            </li>
          )}

          {chatItems.map((chatItem, index) => {
            const GUIDES_PLACEHOLDER = "%%GUIDES_PLACEHOLDER%%";
            let textBeforePlaceholder = chatItem.text;
            const hasPlaceholder =
              !chatItem.isUser && chatItem.text.includes(GUIDES_PLACEHOLDER);

            if (hasPlaceholder) {
              const parts = chatItem.text.split(GUIDES_PLACEHOLDER);
              textBeforePlaceholder = parts[0] ?? "";
            }

            const renderGuidesComponent = (
              guides: Guide[] | undefined,
              headerText?: string | null,
            ) => {
              if (!guides || !Array.isArray(guides) || guides.length === 0) {
                return null;
              }

              const displayHeader = (headerText ?? "Kilder:")
                .replace(/\*\*/g, "")
                .replace(/\*/g, "");

              return (
                <div className="mb-2 mt-3 flex flex-col gap-2">
                  {displayHeader && (
                    <h4 className="text-md mb-1 font-semibold">
                      {displayHeader}
                    </h4>
                  )}
                  {guides.map((guide, guideIndex) => (
                    <a
                      key={guideIndex}
                      href={guide.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block rounded-md border border-blue-200 bg-white px-3 py-2 text-left text-blue-700 shadow-sm transition-all hover:bg-blue-50" // Removed mb-1 to control spacing via gap-2 on parent
                    >
                      <span className="flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="mr-2 h-4 w-4 flex-shrink-0 text-blue-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>

                        {guide.title}
                      </span>
                    </a>
                  ))}
                </div>
              );
            };

            return (
              <li
                data-cy="chat-output"
                className={
                  chatItem.isUser
                    ? "mb-4 ml-8 max-w-[80%] self-end rounded-lg bg-gray-100 p-2 text-black"
                    : "mb-4 mr-8 max-w-[80%] self-start rounded-lg bg-kartAI-lightblue bg-opacity-10 p-2 text-black"
                }
                key={chatItem.timestamp ?? index}
              >
                {chatItem.isUser ? (
                  <div className="prose prose-sm max-w-none whitespace-pre-wrap break-words">
                    {chatItem.text}
                  </div>
                ) : (
                  <>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                      components={{
                        p: ({ ...props }) => <p className="my-2" {...props} />,
                        li: ({ ...props }) => (
                          <li className="mb-1 ml-4" {...props} />
                        ),
                        a: ({ children, href, ...props }) => (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="my-1 inline-block rounded-md border border-blue-200 bg-white px-3 py-2 text-left text-blue-700 shadow-sm transition-all hover:bg-blue-50"
                            {...props}
                          >
                            <span className="flex items-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="mr-2 h-4 w-4 flex-shrink-0 text-blue-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                />
                              </svg>
                              {children}
                            </span>
                          </a>
                        ),
                        strong: ({ ...props }) => (
                          <strong className="font-semibold" {...props} />
                        ),
                        h3: ({ ...props }) => (
                          <h3
                            className="mb-2 mt-3 text-lg font-bold"
                            {...props}
                          />
                        ),
                      }}
                    >
                      {textBeforePlaceholder}
                    </ReactMarkdown>

                    {hasPlaceholder &&
                      renderGuidesComponent(
                        chatItem.guides,
                        chatItem.original_header,
                      )}
                  </>
                )}
              </li>
            );
          })}
        </ul>
        <div className="relative mt-auto w-full">
          <textarea
            id="planprat-input"
            className="max-h-[10rem] min-h-[4rem] w-full resize-y rounded-lg bg-gray-200 p-2 pr-12 text-black shadow-inner"
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
            className="absolute bottom-2 right-2 rounded bg-transparent p-2 disabled:opacity-50"
            onClick={handleSendMessage}
            aria-label="Send message"
          >
            <SendHorizonal
              size={24}
              className="text-kartAI-blue transition duration-300 hover:text-blue-800"
            />
          </button>
        </div>
      </div>
    </div>
  );
}
