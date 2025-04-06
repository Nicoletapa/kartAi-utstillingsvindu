"use client"

import React, { useState, useRef, useCallback } from 'react'
import TiltaksAidMap from './TiltaksAidMap';
import type { Map } from 'leaflet';
import type { SpatialAnalysisResult } from '~/utils/propertyUtils';
import { usePropertySearch } from '~/hooks/usePropertySearch';
import { PropertySearchBar } from './map/PropertySearchBar';
import { searchProperty as fetchProperty } from '~/utils/propertyUtils';
import * as L from 'leaflet';
import Link from 'next/link'
import { Bot, Check, Plus } from 'lucide-react';


interface FieldDisplay {
    label: string;
    value: string;
  }

  interface Property {
    id: string;
    address: string;
  }

const MyProperty = () => {
      const [formData, setFormData] = useState<{
        property: { address: string; property_number?: string; usage_number?: string; municipality?: string; plan_area?: string; plan_id?: string; };
        regulation: { purpose?: string; utilization_rate?: string; max_height?: string; limit?: string; conservation_values?: string; };
      }>({
        property: { address: '', property_number: '', usage_number: '', municipality: '', plan_area: '', plan_id: '' },
        regulation: { purpose: '', utilization_rate: '', max_height: '', limit: '', conservation_values: '' }
      });

      const [properties, setProperties] = useState<Property[]>([]);
      const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
       const mapRef = useRef<Map | null>(null);
        const [mapReady, setMapReady] = useState(false);
        const [lastDrawnShape, setLastDrawnShape] = useState<GeoJSON.Feature | null>(null);
        const [spatialAnalysis, setSpatialAnalysis] = useState<SpatialAnalysisResult | null>(null);
        const [propertyBoundary, setPropertyBoundary] = useState<L.Layer | null>(null);
        const [propertyBoundaries, setPropertyBoundaries] = useState<GeoJSON.Feature[]>([]);
        const [autoZoomSuccessful, setAutoZoomSuccessful] = useState(false);
        const MAX_ZOOM = 19; // Adjust this value as needed
        const { userData } = usePropertySearch();
        const loggedPropertyData = useRef(false);
        
        const handleMapReady = useCallback((map: Map) => {
          if (mapRef.current) return; 
          mapRef.current = map;
          setMapReady(true);
        }, []);
        
        const handleShapeDrawn = useCallback((shape: GeoJSON.Feature, analysis?: SpatialAnalysisResult) => {
          setLastDrawnShape(shape);
          setSpatialAnalysis(analysis || null);
        }, []);
    
      const propertyData: FieldDisplay[] = [
        { label: "Adresse:", value: formData.property.address || 'Ikke angitt' },
        { label: "Gårdsnr.:", value: formData.property.property_number || 'Ikke angitt' },
        { label: "Bruksnr.:", value: formData.property.usage_number || 'Ikke angitt' },
        { label: "Kommune:", value: formData.property.municipality || 'Ikke angitt' },
        { label: "Planområde:", value: formData.property.plan_area || 'Ikke angitt' },
        { label: "PlanID:", value: formData.property.plan_id || 'Ikke angitt' },
      ];

      const regulationInfoData: FieldDisplay[] = [
        { label: "Formål:", value: formData.regulation.purpose || 'Ikke angitt' },
        { label: "Tillatt utnyttelsesgrad (BYA):", value: formData.regulation.utilization_rate || 'Ikke angitt' },
        { label: "Maks byggehøyde:", value: formData.regulation.max_height || 'Ikke angitt' },
        { label: "Byggegrense:", value: formData.regulation.limit || 'Ikke angitt' },
        { label: "Verneverdier:", value: formData.regulation.conservation_values || 'Ikke angitt' },
      ]

      const handlePropertyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
          const propertyId = e.target.value;
          setSelectedPropertyId(propertyId);
          
          const selectedProperty = properties.find(p => p.id === propertyId);
          if (selectedProperty) {
            setFormData(prev => ({
              ...prev,
              property: {
                ...prev.property,
                address: selectedProperty.address,
              }
            }));
          }
        };
        const { 
            searchInput, 
            setSearchInput, 
            errorMessage, 
            setErrorMessage
          } = usePropertySearch();
          
          const handlePropertySearch = async (propertyNumberToSearch: string = searchInput) => {
            const data = await fetchProperty(propertyNumberToSearch, process.env.NEXT_PUBLIC_SUPABASE_KEY);
            
            if (!data || data.length === 0) {
              setErrorMessage('No property found with this number or invalid property data');
              return;
            }
            
            if (data[0]?.geom) {
              if (propertyBoundary && mapRef.current) {
                mapRef.current.removeLayer(propertyBoundary);
              }
        
              // Convert the property data to a GeoJSON feature with ID
              const propertyFeature = {
                type: 'Feature',
                geometry: data[0]?.geom,
                properties: { 
                  id: propertyNumberToSearch,
                  matrikkelnummer: data[0]?.matrikkelnummer
                }
              } as GeoJSON.Feature;
        
              // Replace setter with direct assignment to a local constant to prevent unused state
              const currentPropertyData = data[0] ?? null;
              
              // Only log once per component instance
              if (!loggedPropertyData.current && currentPropertyData) {
                console.log('Current property data:', currentPropertyData);
                loggedPropertyData.current = true;
              }
              
              setPropertyBoundaries([propertyFeature]);
        
              const newBoundary = L.geoJSON(data[0]?.geom, {
                style: {
                  color: 'blue',
                  weight: 2,
                  fillOpacity: 0.1
                }
              });
        
              if (mapRef.current) {
                newBoundary.addTo(mapRef.current);
                
                mapRef.current.fitBounds(newBoundary.getBounds(), {
                  maxZoom: MAX_ZOOM,
                  padding: [20, 20] 
                });
                
                setAutoZoomSuccessful(true);
              }
        
              setPropertyBoundary(newBoundary);
              setErrorMessage(null);
            }
          };
  return (
    <div className='p-4 md:mx-20 px-6'>
      <h1 className='text-3xl pt-4 font-bold flex justify-center text-kartAI-blue mb-8'>Min Eiendom</h1>
      <p className='text-xl mb-4 flex justify-center'>Her får du en oversikt over informasjon som gjelder for
        eiendommen du skal søke på. Dette hjelper deg med å forstå hvilke regler som gjelder, og hva som er mulig å bygge.
      </p>

      <div className='flex flex-col'>
                  <select 
                    name="velgEiendom" 
                    id="velgEiendom" 
                    value={selectedPropertyId || ''}
                    onChange={handlePropertyChange}
                    className='bg-gray-200 border-2 border-gray-300 focus:outline-none focus:ring rounded-md mt-2 mb-2 p-2'
                  >
                    <option value="">Velg eiendom</option>
                    {properties.map(property => (
                      <option key={property.id} value={property.id}>{property.address}</option>
                    ))}
                  </select>

                  <h1 className='text-2xl font-medium mt-8 mb-2'>Adresse og Eiendomsinformasjon</h1>
                  
                  <div className="flex flex-col md:flex-row md:gap-8 w-full">
                    {/* Property details */}
                    <div className="flex-1 space-y-2">
                      <DisplayFields fields={propertyData} />
                    </div>
                  </div>
                </div>
            <div className='mt-8'>
                <h1 className='text-2xl font-medium mb-2'>Kartutsnitt</h1>
                <PropertySearchBar
        searchInput={searchInput}
        onSearchInputChange={setSearchInput}
        onSearch={() => handlePropertySearch()}
        errorMessage={errorMessage}
      />
      <div className='no-rounded-map'>
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
    </div>
    <div className='mt-8'>
        <h1 className='text-2xl font-medium mb-2'>Reguleringsinformasjon</h1>
        <div className="flex-1 space-y-2">
            <DisplayFields fields={regulationInfoData} />
        </div>
    </div>

    <div className='mt-8'>
        <h1 className='text-2xl font-medium mb-2'>Dokumenter knyttet til eiendommen</h1>
        [HENT DOKUMENTER (REGULERINGSBESTEMMELSER, SITUASJONSKART, KOMMUNEDELPLAN)]
    </div>

    <div className='mt-8'>
        <h1 className='text-2xl font-medium mb-2'>Spesielle hensyn / merknader</h1>
        <p className='italic'>Det finnes ingen kjente restriksjoner eller hensyn knyttet til denne eiendommen. <br />
        (Eksempler kan være: flomfare, kvikkleire, kulturminner, osv.)</p>
    </div>
      
    <h1 className='text-2xl font-medium mt-8 mb-2'>Klar for å starte?</h1>
<p>Du kan velge hvordan du vil komme i gang:</p>
<ul className='list-disc ml-8 space-y-1 mb-4'>
    <li>
    <Link href="/atlas-app" className="flex items-center gap-2 hover:underline">
      <Plus size={20} />
      Start ny søknad
    </Link>
    </li>
    <li>
    <Link href="/atlas-app/sidebar/sjekkliste" className="flex items-center gap-2 hover:underline">
      <Check size={20} />
      Gå til sjekkliste
    </Link>
    </li>
    <li>
    <Link href="/atlas-app" className="flex items-center gap-2 hover:underline">
      <Bot size={20} />
      Start med chatbotten for veiledning
    </Link>
    </li>
</ul>
    </div>
  )
};

const DisplayFields: React.FC<{ fields: FieldDisplay[] }> = ({ fields }) => (
  <div className="space-y-2">
    {fields.map((field, index) => (
      <div key={index} className="flex">
        <p className="font-medium mr-1">{field.label}</p>
        <span>{field.value}</span>
      </div>
    ))}
  </div>
);

export default MyProperty