"use client";
import { type ChangeEvent, useState, type KeyboardEvent, useEffect } from "react";
import Image from "next/image";
import { api } from "~/trpc/react";
import type { Map } from 'leaflet';

interface PlanPratProps {
  mapRef?: React.MutableRefObject<Map | null>;
  lastDrawnShape?: GeoJSON.Feature | null;
  mapReady?: boolean;
}

export function PlanPrat({ mapRef, lastDrawnShape, mapReady = false }: PlanPratProps) {
  const [error, setError] = useState("");
  const [text, setText] = useState<string>("");
  const [chatItems, setChatItems] = useState<
    { text: string; isUser: boolean }[]
  >([]);
  const [shapeContext, setShapeContext] = useState<string | null>(null);
  const utils = api.useUtils();

  // Monitor for changes in the drawn shape
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
      
      setShapeContext(description);
      
      // Optional: Automatically notify in chat about the new shape
      setChatItems((prevChatItems) => [
        { text: `System: ${description} Ask me about it!`, isUser: false },
        ...prevChatItems,
      ]);
    }
  }, [lastDrawnShape]);

  async function queryPlanprat(queryInput: string) {
    try {
      // Include information about the map context in the query
      let enhancedQuery = queryInput;
      
      if (lastDrawnShape) {
        // Add shape context to the query
        const shapeInfo = JSON.stringify(lastDrawnShape);
        enhancedQuery = `${queryInput} [Context: User has drawn on the map: ${shapeInfo}]`;
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

  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    // Update state with textarea input
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
    <section className="rounded-lg shadow-lg">
      <h1 className="w-full rounded-lg bg-kartAI-blue pb-6 pt-1 text-center text-white">
        PlanChat
      </h1>
      
      {/* Map context indicator */}
      {mapReady && (
        <div className="bg-green-100 p-2 text-sm">
          <span className="font-semibold">Map connected.</span>
          {shapeContext && (
            <div className="mt-1">
              <span className="italic">{shapeContext}</span>
            </div>
          )}
        </div>
      )}
      
      <div id="planprat-input-output" className="relative w-full p-2">
        <ul
          id="planprat-output "
          className="flex h-96 w-full flex-col-reverse overflow-y-auto rounded-lg p-2 shadow-inner"
        >
          {chatItems.map((chatItem, index) => (
            <li
              data-cy="chat-output"
              className={
                chatItem.isUser
                  ? "m-2 ml-6 self-end rounded-lg border-2 p-2 text-black shadow-lg"
                  : "m-2 mr-6 self-start rounded-lg bg-kartAI-blue p-2 text-white shadow-lg"
              }
              key={index}
            >
              {chatItem.text}
            </li>
          ))}
        </ul>
        <textarea
          id="planprat-input"
          className="mt-2 w-full min-h-14 rounded-lg p-2 pr-12 text-black shadow-inner"
          placeholder="Still meg et spørsmål ..."
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
        ></textarea>
        <button
          type="submit"
          id="planprat-input-button"
          className="absolute bottom-8 right-4 rounded"
          onClick={handleSubmit}
        >
          <Image
            src="/Ikoner/Dark/SVG/Comment.svg"
            alt="send"
            height="30"
            width="30"
            className="rounded bg-kartAI-blue p-1 text-white"
          ></Image>
        </button>
      </div>
      <p className="py-4 text-center text-red-500">{error}</p>
    </section>
  );
}
