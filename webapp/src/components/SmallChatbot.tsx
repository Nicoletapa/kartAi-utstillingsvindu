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
        // Store the current map instance and container ID for cleanup
        const mapToRemove = mapInstance.current.map;
        const containerIdToRemove = mapInstance.current.containerId;

        return () => {
            if (mapToRemove) {
                try {
                    // Attempt to remove the map instance
                    mapToRemove.remove();
                    // Optionally, verify container cleanup if needed, but avoid internal properties like _leaflet_map
                    // const container = document.getElementById(containerIdToRemove);
                    // if (container) { /* potentially check classes or attributes if necessary */ }
                } catch (e) {
                    console.warn('Map cleanup error:', e);
                } finally {
                    // Reset the ref only if it hasn't been reassigned
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
    }, []) // Dependency array is empty as we capture the initial map instance for cleanup

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
        setSpatialAnalysis(analysis ?? null) // Use nullish coalescing
    }, [])

    return (
        <div>
            <button 
                onClick={handleToggle} 
                className='fixed right-10 bottom-14 h-14 w-14 bg-kartAI-blue rounded-full justify-center flex items-center cursor-pointer z-30'
            >
                <Bot size={30} className='text-white' />
            </button>

            {showChatbot && (
                <div
                className={clsx(
                    'fixed flex mb-2 bottom-28 right-10 z-40 transition-all duration-300',
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
                                mapRef={mapInstance}
                                lastDrawnShape={lastDrawnShape}
                                spatialAnalysis={spatialAnalysis}
                                disableTopRightRadius={expanded}
                                disableBottomRightRadius={expanded}
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