"use client"

import React, { useCallback, useEffect, useState } from 'react' 
import { Bot, X, Maximize2, Minimize2 } from 'lucide-react'
import { PlanPrat } from './PlanChatAtlas'
import TiltaksAidMap from './TiltaksAidMap'
import type { Map } from 'leaflet'
import type { Feature } from 'geojson';
import type { SpatialAnalysisResult } from '~/utils/propertyUtils'
import { usePropertySearch } from '~/hooks/usePropertySearch'
import clsx from 'clsx'
import { usePathname } from 'next/navigation'
// --- Import the store ---
import { useChatStore, MIN_OVERSIKT_PATH, MAIN_CHATBOT_SECTION_ID } from '~/store/chatStore'; 


const SmallChatbot = () => {
    const pathname = usePathname();
    const { userData } = usePropertySearch();

    // --- Get state and actions from the store ---
    const {
        showChatbot,
        isExpanded,
        isVisible,
        lastDrawnShape,
        spatialAnalysis,
        mapInstanceRef,
        openBubble,
        closeBubble,
        toggleExpand,
        setLastDrawnShape,
        setMapInstance,
        clearMapInstance,
    } = useChatStore();
    // ------------------------------------------

    // Local state only for the unique map container ID
    const [mapContainerId] = useState(() => `map-container-${Math.random().toString(36).slice(2, 11)}`);

    // --- Map Handling ---
    const handleMapReady = useCallback((map: Map) => {
        // Update map instance in the global store
        if (!mapInstanceRef.map) {
            setMapInstance({ map, ready: true, containerId: mapContainerId });
            console.log("Map ready in SmallChatbot (global state):", mapContainerId);
        }
    }, [mapContainerId, setMapInstance, mapInstanceRef.map]); // Added dependencies

    // Cleanup map instance on component unmount (if SmallChatbot itself unmounts)
    useEffect(() => {
        // Get the map instance details *at the time the effect runs*
        const mapToRemove = mapInstanceRef.map;
        const containerId = mapInstanceRef.containerId;

        return () => {
            // Check if the map instance we captured still exists in the store
            // This check might be less critical if SmallChatbot lives in the root layout
            // and never unmounts, but good practice anyway.
            const currentMapInStore = useChatStore.getState().mapInstanceRef.map;

            if (mapToRemove && mapToRemove === currentMapInStore) {
                console.log("Cleaning up map in SmallChatbot (global state):", containerId);
                try {
                    mapToRemove.remove();
                } catch (e) {
                    console.warn('Map cleanup error:', e);
                } finally {
                    clearMapInstance(); // Clear map state in the store
                }
            }
        };
        // Depend on clearMapInstance to ensure stable function reference
    }, [clearMapInstance, mapInstanceRef.map, mapInstanceRef.containerId]);


    // --- Chat Toggle Logic ---
    const handleToggle = useCallback(() => {
        if (pathname === MIN_OVERSIKT_PATH) {
            const mainChatbotElement = document.getElementById(MAIN_CHATBOT_SECTION_ID);
            if (mainChatbotElement) {
                mainChatbotElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                if (showChatbot) closeBubble(); // Ensure bubble closes if scrolling
            } else {
                console.warn(`Could not find element with ID '${MAIN_CHATBOT_SECTION_ID}' to scroll to. Toggling bubble instead.`);
                // Fallback: Toggle bubble if element not found
                if (showChatbot) {
                    closeBubble();
                } else {
                    openBubble();
                }
            }
        } else {
            // Default behavior: Toggle bubble
            if (showChatbot) {
                closeBubble();
            } else {
                openBubble();
            }
        }
    }, [pathname, showChatbot, openBubble, closeBubble]); // Dependencies from store

    // --- Shape Drawing ---
    // Use the action from the store
    const handleShapeDrawn = useCallback((shape: Feature, analysis?: SpatialAnalysisResult) => {
        setLastDrawnShape(shape, analysis);
    }, [setLastDrawnShape]);

    // --- Optional: Hide button entirely on specific paths ---
    // if (pathname === MIN_OVERSIKT_PATH) {
    //     return null;
    // }

    return (
        <div>
            {/* Toggle Button */}
            <button
                onClick={handleToggle}
                className='fixed right-10 bottom-14 h-14 w-14 bg-kartAI-blue rounded-full justify-center flex items-center cursor-pointer z-30 shadow-lg hover:bg-kartAI-darkblue transition-colors'
                aria-label={pathname === MIN_OVERSIKT_PATH ? "Scroll to chatbot" : "Open chatbot"}
            >
                <Bot size={30} className='text-white' />
            </button>

            {/* Chat Window - Renders based on store state */}
            {showChatbot && (
                <div
                    className={clsx(
                        'fixed flex mb-2 bottom-28 right-10 z-40 transition-all duration-300',
                        isExpanded ? 'w-[900px]' : 'w-[350px]',
                        isVisible
                            ? 'opacity-100 scale-100'
                            : 'opacity-0 scale-95 pointer-events-none',
                        'transform transition-all ease-out duration-300'
                    )}
                >
                    {/* Chat Panel */}
                    <div className={clsx(
                        'h-[500px] transition-all duration-300',
                        isExpanded ? 'w-[350px]' : 'w-full'
                    )}>
                        <div className='relative h-full bg-white rounded-l-lg rounded-r-none shadow-lg'>
                            {/* Expand/Minimize Button */}
                            <button
                                onClick={toggleExpand} // Use store action
                                className='absolute bg-kartAI-lightblue rounded-md p-1 hover:bg-opacity-70 top-2 left-2 z-10'
                                aria-label={isExpanded ? "Minimize chat" : "Expand chat"}
                            >
                                {isExpanded ? <Minimize2 size={20} className='text-white' /> : <Maximize2 size={20} className='text-white' />}
                            </button>
                            {/* Close Button */}
                            <button
                                onClick={closeBubble} // Use store action
                                className='absolute bg-kartAI-lightblue rounded-md p-1 hover:bg-opacity-70 top-2 right-2 z-10'
                                aria-label="Close chat"
                            >
                                <X size={20} className='text-white' />
                            </button>
                           
                            <PlanPrat
                                onClose={closeBubble} 
                                mapRefFromStore={mapInstanceRef}
                                
                                lastDrawnShapeFromStore={lastDrawnShape}
                                spatialAnalysisFromStore={spatialAnalysis}
                                
                                disableTopRightRadius={isExpanded}
                                disableBottomRightRadius={isExpanded}
                            />
                        </div>
                    </div>

                    {isExpanded && (
                        <div id={mapContainerId} className='w-[60%] h-[500px] shadow-lg rounded-r-lg overflow-hidden'>
                            <TiltaksAidMap
                                onMapReady={handleMapReady}
                                onShapeDrawn={handleShapeDrawn}
                                userGnr={userData?.gnr}
                                userBnr={userData?.bnr}
                                userFnr={userData?.fnr}
                                userSnr={userData?.snr}
                                autoZoom={true}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SmallChatbot;