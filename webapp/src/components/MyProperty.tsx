"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import * as L from "leaflet";
import type { Map } from "leaflet";
import Link from "next/link";
import { Plus, Check, Bot } from "lucide-react";
import TiltaksAidMap from "./TiltaksAidMap";
import { PropertySearchBar } from "./map/PropertySearchBar";
import { api } from "~/trpc/react";
import { useSession } from "next-auth/react";
import { usePropertySearch } from "~/hooks/usePropertySearch";
import { searchProperty as fetchProperty } from "~/utils/propertyUtils";
import type { SpatialAnalysisResult } from "~/utils/propertyUtils";
import KlarForASoke from "./KlarForASoke";

interface FieldDisplay {
  label: string;
  value: string;
}

interface Property {
  id: string;
  address: string;
  gnr: number;
  bnr: number;
  postalArea: string;
}

const MAX_ZOOM = 19;

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

const MyProperty = () => {
  const [formData, setFormData] = useState({
    property: {
      address: "",
      gnr: "",
      bnr: "",
      postalArea: "",
      plan_area: "",
      plan_id: "",
    },
    regulation: {
      purpose: "",
      utilization_rate: "",
      max_height: "",
      limit: "",
      conservation_values: "",
    },
  });

  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [propertyBoundary, setPropertyBoundary] = useState<L.Layer | null>(null);
  const [propertyBoundaries, setPropertyBoundaries] = useState<GeoJSON.Feature[]>([]);
  const [lastDrawnShape, setLastDrawnShape] = useState<GeoJSON.Feature | null>(null);
  const [spatialAnalysis, setSpatialAnalysis] = useState<SpatialAnalysisResult | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [autoZoomSuccessful, setAutoZoomSuccessful] = useState(false);

  const mapRef = useRef<Map | null>(null);
  const loggedPropertyData = useRef(false);

  const { data: session } = useSession();
  const { data: userDetails } = api.user.getUserDetails.useQuery(undefined, {
    enabled: !!session,
  });

  const { userData, searchInput, setSearchInput, errorMessage, setErrorMessage } = usePropertySearch();

  const handleMapReady = useCallback((map: Map) => {
    if (!mapRef.current) {
      mapRef.current = map;
      setMapReady(true);
    }
  }, []);

  const handleShapeDrawn = useCallback((shape: GeoJSON.Feature, analysis?: SpatialAnalysisResult) => {
    setLastDrawnShape(shape);
    setSpatialAnalysis(analysis ?? null);
  }, []);

  const handlePropertyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const propertyId = e.target.value;
    setSelectedPropertyId(propertyId);

    const selected = properties.find((p) => p.id === propertyId);
    if (selected) {
      setFormData((prev) => ({
              ...prev,
              property: { 
                ...prev.property, 
                address: selected.address,
                postalArea: selected.postalArea,
                gnr: selected.gnr.toString(),
                bnr: selected.bnr.toString(),
               },
            }));
    }
  };

  const handlePropertySearch = async (propertyNumberToSearch: string = searchInput) => {
    const data = await fetchProperty(propertyNumberToSearch, process.env.NEXT_PUBLIC_SUPABASE_KEY);

    if (!data?.length) {
      setErrorMessage("No property found with this number or invalid property data");
      return;
    }

    const geometry = data[0]?.geom as GeoJSON.Geometry | undefined;
    if (!geometry) {
      setErrorMessage("Invalid geometry data for the property");
      return;
    }
    if (!geometry) return;

    if (propertyBoundary && mapRef.current) {
      mapRef.current.removeLayer(propertyBoundary);
    }

    const propertyFeature: GeoJSON.Feature = {
      type: "Feature",
      geometry: geometry,
      properties: {
        id: propertyNumberToSearch,
        matrikkelnummer: data[0]?.matrikkelnummer,
      },
    };
    
    setPropertyBoundaries([propertyFeature]);

    if (!loggedPropertyData.current) {
      console.log("Current property data:", data[0]);
      loggedPropertyData.current = true;
    }

    const newBoundary = L.geoJSON(propertyFeature, {
      style: { color: "blue", weight: 2, fillOpacity: 0.1 },
    });

    if (mapRef.current) {
      newBoundary.addTo(mapRef.current);
      mapRef.current.fitBounds(newBoundary.getBounds(), { maxZoom: MAX_ZOOM, padding: [20, 20] });
      setAutoZoomSuccessful(true);
    }

    setPropertyBoundary(newBoundary);
    setErrorMessage(null);
  };

  useEffect(() => {
    if (userDetails) {
      setProperties([
        { 
          id: userDetails.id, address: userDetails.address ?? "Hovedgata 1, 0123 Oslo", 
          postalArea: userDetails.postalArea ?? "Ikke angitt",
          gnr: userDetails.gnr ?? 0, bnr: userDetails.bnr ?? 0, 
        },
      ]);
    }
  }, [userDetails]);

  const propertyData: FieldDisplay[] = [
    { label: "Adresse:", value: formData.property.address || "Ikke angitt" },
    { label: "Gårdsnr.:", value: formData.property.gnr || "Ikke angitt" },
    { label: "Bruksnr.:", value: formData.property.bnr || "Ikke angitt" },
    { label: "Kommune:", value: formData.property.postalArea || "Ikke angitt" },
    { label: "Gårdsnr.:", value: formData.property.gnr || "Ikke angitt" },
    { label: "Bruksnr.:", value: formData.property.bnr || "Ikke angitt" },
    { label: "Kommune:", value: formData.property.postalArea || "Ikke angitt" },
    { label: "Planområde:", value: formData.property.plan_area || "Ikke angitt" },
    { label: "PlanID:", value: formData.property.plan_id || "Ikke angitt" },
  ];

  const regulationInfoData: FieldDisplay[] = [
    { label: "Formål:", value: formData.regulation.purpose || "Ikke angitt" },
    { label: "Tillatt utnyttelsesgrad (BYA):", value: formData.regulation.utilization_rate || "Ikke angitt" },
    { label: "Maks byggehøyde:", value: formData.regulation.max_height || "Ikke angitt" },
    { label: "Byggegrense:", value: formData.regulation.limit || "Ikke angitt" },
    { label: "Verneverdier:", value: formData.regulation.conservation_values || "Ikke angitt" },
  ];

  return (
    <div className="p-4 md:mx-20 px-6">
      <h1 className="text-3xl pt-4 font-bold flex justify-center text-kartAI-blue mb-8">Min Eiendom</h1>
      <p className="text-xl mb-4 flex justify-center">
        Her får du en oversikt over informasjon som gjelder for eiendommen du skal søke på.
        Dette hjelper deg med å forstå hvilke regler som gjelder, og hva som er mulig å bygge.
      </p>

      <div className="flex flex-col">
        <select
          name="velgEiendom"
          id="velgEiendom"
          value={selectedPropertyId ?? ""}
          onChange={handlePropertyChange}
          className="bg-gray-200 border-2 border-gray-300 focus:outline-none focus:ring rounded-md mt-2 mb-2 p-2"
        >
          <option value="">Velg eiendom</option>
          {properties.map((property) => (
            <option key={property.id} value={property.id}>{property.address}</option>
          ))}
        </select>

        <h2 className="text-2xl font-medium mt-8 mb-2">Adresse og Eiendomsinformasjon</h2>
        <DisplayFields fields={propertyData} />
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-medium mb-2">Kartutsnitt</h2>
        <PropertySearchBar
          searchInput={searchInput}
          onSearchInputChange={setSearchInput}
          onSearch={() => handlePropertySearch()}
          errorMessage={errorMessage}
        />
        <div className="no-rounded-map relative z-0">
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

      <div className="mt-8">
        <h2 className="text-2xl font-medium mb-2">Reguleringsinformasjon</h2>
        <DisplayFields fields={regulationInfoData} />
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-medium mb-2">Dokumenter knyttet til eiendommen</h2>
        [HENT DOKUMENTER (REGULERINGSBESTEMMELSER, SITUASJONSKART, KOMMUNEDELPLAN)]
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-medium mb-2">Spesielle hensyn / merknader</h2>
        <p className="italic">
          Det finnes ingen kjente restriksjoner eller hensyn knyttet til denne eiendommen. <br />
          (Eksempler kan være: flomfare, kvikkleire, kulturminner, osv.)
        </p>
      </div>

      <div className="mt-8">
        <KlarForASoke />
      </div>
    </div>
  );
};

export default MyProperty;
