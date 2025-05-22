/**
 * This file is used in Utstillingsvindu 2.0
 * 
 * @description
 * This component is the minified chatbot (PlanChatAtlas.tsx) that appears on the right side of the screen,
 * The user can click on it to expand and interact with the chatbot.
 * If expanded, it shows a map (TiltaksAidMap) on the right side.
 * 
 * @features
 * - Minified chatbot icon
 * - Expandable to show the chatbot and map
 * - Map integration (TiltaksAidMap)
 * - Close button to hide the chatbot
 * 
 * @props
 * - `showChatbot` (boolean): State to control the visibility of the chatbot.
 * - `expanded` (boolean): State to control the expanded state of the chatbot.
 * - `isVisible` (boolean): State to control the visibility of the chatbot.
 * - `lastDrawnShape` (GeoJSON.Feature | null): State to store the last drawn shape on the map.
 * - `spatialAnalysis` (SpatialAnalysisResult | null): State to store the spatial analysis result.
 * - `mapInstance` (ref): Ref to store the map instance.
 * - `mapContainerId` (string): Unique ID for the map container.
 * - `handleMapReady` (function): Callback function to handle when the map is ready.
 * - `handleCloseChat` (function): Callback function to handle closing the chatbot.
 * - `handleToggle` (function): Callback function to handle toggling the chatbot visibility.
 * - `handleExpandToggle` (function): Callback function to handle expanding/collapsing the chatbot.
 * - `handleShapeDrawn` (function): Callback function to handle when a shape is drawn on the map.
 * 
 * @note
 * - This component is designed to be used in a client-side context.
 * - It uses the `useState`, `useRef`, `useCallback`, and `useEffect` hooks from React.
 * - It uses the `usePropertySearch` hook to get user data.
 * - It uses the `clsx` library for conditional class names.
 * 
 * @usage
 * const SmallChatbotWithNoSSR = dynamic(
 *      () => import('~/components/SmallChatbot'),
 *      { ssr: false }
 * );
 * 
 * <SmallChatbotWithNoSSR />
 */

"use client"

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Bot, X, Maximize2, Minimize2 } from 'lucide-react'
import { PlanPrat } from './PlanChatAtlas'
import TiltaksAidMap from './TiltaksAidMap'
import type { Map } from 'leaflet'
import type { SpatialAnalysisResult } from '~/utils/propertyUtils'
import { usePropertySearch } from '~/hooks/usePropertySearch'
import clsx from 'clsx'

const SmallChatbot = () => {
    const [showChatbot, setShowChatbot] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [isVisible, setIsVisible] = useState(false)

    const [lastDrawnShape, setLastDrawnShape] = useState<GeoJSON.Feature | null>(null);
    const [spatialAnalysis, setSpatialAnalysis] = useState<SpatialAnalysisResult | null>(null);

    const { userData } = usePropertySearch()

    const mapInstance = useRef<{ map: Map | null; ready: boolean; containerId: string | null; }>({
        map: null,
        ready: false,
        containerId: null,
    });

    const [mapContainerId] = useState(() => `map-container-${Math.random().toString(36).substr(2, 9)}`);

    const handleMapReady = useCallback((map: Map) => {
        if (!mapInstance.current.map) {
            mapInstance.current = { map, ready: true, containerId: mapContainerId };
        }
    }, [mapContainerId])

    const handleCloseChat = () => {
        setIsVisible(false)
        setTimeout(() => {
            setShowChatbot(false)
            setExpanded(false)
        }, 300)
    }

    useEffect(() => {
        const mapToRemove = mapInstance.current.map;

        return () => {
            if (mapToRemove) {
                try {
                    mapToRemove.remove();
                } catch (e) {
                    console.warn('Map cleanup error:', e);
                } finally {
                    if (mapInstance.current.map === mapToRemove) {
                        mapInstance.current = {
                            map: null,
                            ready: false,
                            containerId: null,
                        };
                    }
                }
            }
        }
    }, [])

    const handleToggle = () => {
        if (showChatbot) {
            handleCloseChat()
        } else {
            setShowChatbot(true)
            setTimeout(() => setIsVisible(true), 10)
        }
    }

    const handleExpandToggle = () => {
        setExpanded(prev => !prev);
    }

    const handleShapeDrawn = useCallback((shape: GeoJSON.Feature, analysis?: SpatialAnalysisResult) => {
        setLastDrawnShape(shape)
        setSpatialAnalysis(analysis ?? null)
    }, [])

    return (
        <div>
            <div className='fixed right-10 bottom-14 z-30 group'>
                <button
                    onClick={handleToggle}
                    className='h-14 w-14 bg-kartAI-blue rounded-full justify-center flex items-center cursor-pointer relative'
                >
                    <Bot size={30} className='text-white' />
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-700 text-white text-xs py-1 px-2 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                        Chatbot
                    </span>
                </button>
            </div>

            {showChatbot && (
                <div
                    className={clsx(
                        'fixed flex mb-2 bottom-28 right-8 z-40 transition-all duration-300',
                        expanded ? 'w-[900px]' : 'w-[350px]',
                        isVisible
                            ? 'opacity-100 scale-100'
                            : 'opacity-0 scale-95 pointer-events-none',
                        'transform transition-all ease-out duration-300'
                    )}
                >
                    <div className={clsx(
                        'h-[500px] transition-all duration-300',
                        expanded ? 'w-[350px]' : 'w-full'
                    )}>
                        <div className='relative h-full bg-white rounded-l-lg rounded-r-none shadow-lg'>
                            <button
                                onClick={handleExpandToggle}
                                className='absolute bg-kartAI-lightblue rounded-md p-1 hover:bg-opacity-70 top-2 left-2'
                            >
                                {expanded ? (
                                    <Minimize2 size={20} className='text-white' />
                                ) : (
                                    <Maximize2 size={20} className='text-white' />
                                )}
                            </button>
                            <button
                                onClick={handleCloseChat}
                                className='absolute bg-kartAI-lightblue rounded-md p-1 hover:bg-opacity-70 top-2 right-2'
                            >
                                <X size={20} className='text-white' />
                            </button>
                            <PlanPrat
                                onClose={handleCloseChat}
                                mapRefFromStore={{ map: mapInstance.current.map, ready: mapInstance.current.ready }}
                                lastDrawnShapeFromStore={lastDrawnShape}
                                spatialAnalysisFromStore={spatialAnalysis}
                                disableTopRightRadius={expanded}
                                disableBottomRightRadius={false}
                            />
                        </div>
                    </div>

                    {expanded && (
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
    )
}

export default SmallChatbot