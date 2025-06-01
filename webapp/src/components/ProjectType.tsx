/**
 * This file is used in Utstillingsvindu 2.0

 */

"use client";

import * as L from "leaflet";
import type { Map } from "leaflet";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import { toast } from "react-hot-toast";
import TiltaksAidMap from "../components/TiltaksAidMap";
import { PropertySearchBar } from "../components/map/PropertySearchBar";
import {
  searchProperty as fetchProperty,
  createFeatureFromPropertyData,
} from "../utils/propertyUtils";
import { usePropertySearch } from "../hooks/usePropertySearch";
import type { SpatialAnalysisResult } from "../utils/propertyUtils";
import { FormService } from "../utils/api-service";
import { NavigationButtons } from "./NavigationButtons";
import type { ApplicationType } from "@prisma/client";
import { Tooltip, useTooltip } from "./ui/ui-components";
import { tooltipInfo } from "~/utils/tooltipInfo";
import { getErrorMessage } from "~/utils/errorMessage";

interface PageProps {
  formData?: {
    description: string;
  };
  setFormData?: React.Dispatch<
    React.SetStateAction<{
      description: string;
    }>
  >;
  onValidityChange?: (isValid: boolean) => void;
}

const MAX_ZOOM = 19;
const options = [
  {
    value: "Bruksendring",
    label: "Bruksendring",
    description:
      "F.eks. gjøre om en bod til soverom, garasje til hybel eller kjeller til boenhet.",
  },
  {
    value: "Bygge",
    label: "Bygge",
    description:
      "F.eks. garasje, terrasse, gjerde, tilbygg, drivhus eller hagestue.",
  },
  {
    value: "Rive",
    label: "Rive",
    description: "F.eks. gammel garasje, uthus, lekesture eller et tilbygg.",
  },
];

const checkboxOptions = {
  Bygge: [
    { value: "byggeTilbygg", label: "Bygge tilbygg - mindre enn 50m²" },
    {
      value: "byggeFrittliggende",
      label:
        "Bygge frittliggende bygning - mindre enn 70m² og hvor ingen skal bo eller overnatte.",
    },
    { value: "byggeAnnet", label: "Annet (kun etter avtale med kommunen)" },
  ],
  Rive: [
    { value: "riveTilbygg", label: "Rive et tilbygg - mindre enn 50m²" },
    {
      value: "riveFrittliggende",
      label:
        "Rive frittliggende bygning - mindre enn 70m² som ikke er godkjent som bolig eller til overnatting.",
    },
    { value: "riveAnnet", label: "Annet (kun etter avtale med kommunen)" },
  ],
};
interface ProjectTypeFormData {
  description: string;
  projectType: string;
  selectedFeatures: string[];
}

// Move these outside the component at the top of the file
const getApplicationTypeFromSelection = (
  option: string,
): ApplicationType | null => {
  if (option === "Bygge" || option === "Rive") {
    return "sma_byggeprosjekter";
  } else if (option === "Bruksendring") {
    return "bruksendring";
  }
  return null;
};

const getDefaultSubType = (option: string): string | null => {
  if (option === "Bruksendring") {
    return "standard";
  }
  return null;
};

const getSubTypeFromSelection = (
  option: string,
  checkboxes: string[],
): string | null => {
  if (option === "Bygge") {
    if (checkboxes.includes("byggeTilbygg")) return "bygge_tilbygg";
    if (checkboxes.includes("byggeFrittliggende")) return "bygge_frittliggende";
    if (checkboxes.includes("byggeAnnet")) return "bygge_annet";
  } else if (option === "Rive") {
    if (checkboxes.includes("riveTilbygg")) return "rive_tilbygg";
    if (checkboxes.includes("riveFrittliggende")) return "rive_frittliggende";
    if (checkboxes.includes("riveAnnet")) return "rive_annet";
  }
  return null;
};

const ProjectType: React.FC<PageProps> = ({
  formData: externalFormData,
  setFormData: externalSetFormData,
  onValidityChange,
}) => {
  const params = useParams();
  const applicationID = parseInt(params.applicationID as string, 10);

  const [propertyBoundary, setPropertyBoundary] = useState<L.Layer | null>(
    null,
  );
  const [propertyBoundaries, setPropertyBoundaries] = useState<
    GeoJSON.Feature[]
  >([]);
  const [autoZoomSuccessful, setAutoZoomSuccessful] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [lastDrawnShape, setLastDrawnShape] = useState<GeoJSON.Feature | null>(
    null,
  );
  const [spatialAnalysis, setSpatialAnalysis] =
    useState<SpatialAnalysisResult | null>(null);

  const [isUpdating, setIsUpdating] = useState(false);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  // Property search
  const {
    userData,
    searchInput,
    setSearchInput,
    errorMessage,
    setErrorMessage,
  } = usePropertySearch();

  const mapRef = useRef<Map | null>(null);
  const tooltip = useTooltip();
  const initialFormData = React.useMemo(
    (): ProjectTypeFormData => ({
      description: externalFormData?.description ?? "",
      projectType: "",
      selectedFeatures: [],
    }),
    [externalFormData?.description],
  );

  // Form validation function
  const validateForm = React.useCallback(
    (data: ProjectTypeFormData): boolean => {
      const isCheckboxValid =
        data.projectType === "Bygge" || data.projectType === "Rive"
          ? data.selectedFeatures.length > 0
          : true;
      return data.projectType !== "" && isCheckboxValid;
    },
    [],
  );

  // Use FormService
  const { formData, setFormData, isValid } =
    FormService.useForm<ProjectTypeFormData>(initialFormData, validateForm);

  // API Mutations
  const updateApplication = api.application.updateApplication.useMutation({
    onSuccess: () => {
      setIsUpdating(false);
      toast.success("Søknadstype oppdatert");
    },
    onError: (error) => {
      setIsUpdating(false);
      toast.error(`Feil: ${error.message}`);
    },
  });

  const addApplicationField = api.application.addApplicationField.useMutation({
    onError: (error) => {
      toast.error(`Feil ved lagring av felt: ${error.message}`);
    },
  });

  const updateApplicationSubtype =
    api.application.updateApplicationSubtype.useMutation({
      onSuccess: () => {
        toast.success("Søknadstype oppdatert");
      },
      onError: (error) => {
        toast.error(`Feil ved oppdatering av søknadstype: ${error.message}`);
      },
    });

  const { data: applicationData } = api.application.getApplication.useQuery(
    { applicationID },
    { enabled: !isNaN(applicationID) },
  );

  // Map handlers
  const handleMapReady = useCallback((map: Map) => {
    if (!mapRef.current) {
      mapRef.current = map;
      setMapReady(true);
    }
  }, []);

  const handleShapeDrawn = useCallback(
    (shape: GeoJSON.Feature, analysis?: SpatialAnalysisResult) => {
      setLastDrawnShape(shape);
      setSpatialAnalysis(analysis ?? null);
    },
    [],
  );

  // Refactored option change handler
  const handleOptionChange = (value: string) => {
    setFormData({
      ...formData,
      projectType: value,
      selectedFeatures: [],
    });

    const appType = getApplicationTypeFromSelection(value);
    if (appType) {
      updateApplication.mutate({
        applicationID,
        applicationType: appType,
        updatedDate: new Date(),
      });

      const defaultSubType = getDefaultSubType(value);
      if (defaultSubType) {
        saveSubType(defaultSubType);
      }
    }
  };

  const handleCheckboxChange = (checkboxValue: string) => {
    const newCheckboxes = formData.selectedFeatures.includes(checkboxValue)
      ? formData.selectedFeatures.filter((value) => value !== checkboxValue)
      : [...formData.selectedFeatures, checkboxValue];

    setFormData({
      ...formData,
      selectedFeatures: newCheckboxes,
    });

    const updatedSubType = getSubTypeFromSelection(
      formData.projectType,
      newCheckboxes,
    );
    if (updatedSubType) {
      saveSubType(updatedSubType);
    }
  };

  const saveSubType = (subType: string) => {
    updateApplicationSubtype.mutate({
      applicationID,
      subTypeId: subType,
    });
  };

  const handlePropertySearch = async (
    propertyNumberToSearch: string = searchInput,
  ) => {
    const rawData = await fetchProperty(
      propertyNumberToSearch,
      process.env.NEXT_PUBLIC_SUPABASE_KEY,
    );

    const { feature, error } = createFeatureFromPropertyData(
      rawData,
      propertyNumberToSearch,
    );

    if (error) {
      setErrorMessage(error);
      return;
    }

    if (feature) {
      if (propertyBoundary && mapRef.current) {
        mapRef.current.removeLayer(propertyBoundary);
      }

      setPropertyBoundaries([feature]);

      const newBoundary = L.geoJSON(feature, {
        style: { color: "blue", weight: 2, fillOpacity: 0.1 },
      });

      if (mapRef.current) {
        newBoundary.addTo(mapRef.current);
        mapRef.current.fitBounds(newBoundary.getBounds(), {
          maxZoom: MAX_ZOOM,
          padding: [20, 20],
        });
        setAutoZoomSuccessful(true);
      }

      setPropertyBoundary(newBoundary);
      setErrorMessage(null); // Clear any previous error
    }
  };

  const determinedBackPath = `/atlas-app/i-soknad/${applicationID}/applicant-details`;

  const determinedNextPath = React.useMemo(() => {
    if (!formData.projectType) return undefined;

    const appType = getApplicationTypeFromSelection(formData.projectType);

    if (appType === "bruksendring") {
      return `/atlas-app/i-soknad/${applicationID}/bruksendring`;
    } else if (appType) {
      return `/atlas-app/i-soknad/${applicationID}/bygge-eller-rive`;
    }
    return undefined;
  }, [formData.projectType, applicationID, getApplicationTypeFromSelection]);

  const handleBeforeNext = async (): Promise<boolean> => {
    if (!isValid) {
      toast.error("Vennligst fyll ut påkrevde felt.");
      return false;
    }

    setIsUpdating(true);
    try {
      await addApplicationField.mutateAsync({
        applicationID,
        fieldName: "description",
        fieldValue: formData.description || "",
      });

      setIsUpdating(false);
      return true;
    } catch (error: unknown) {
      console.error("Error saving data before next step:", error);
      // Use the utility function here
      const errorMessageText = getErrorMessage(
        error,
        "En feil oppstod ved lagring.",
      );
      toast.error(`Feil: ${errorMessageText}`);
      setIsUpdating(false);
      return false;
    }
  };

  useEffect(() => {
    onValidityChange?.(isValid); // Use optional chaining
  }, [isValid, onValidityChange]);

  useEffect(() => {
    if (!applicationData || initialDataLoaded) {
      return;
    }

    let projectType = "";
    let selectedFeatures: string[] = [];

    if (applicationData?.subTypeId) {
      if (applicationData.subTypeId === "standard") {
        projectType = "Bruksendring";
      } else if (applicationData.subTypeId.startsWith("bygge_")) {
        projectType = "Bygge";
        const subType = applicationData.subTypeId.replace("bygge_", "");
        if (subType === "tilbygg") {
          selectedFeatures = ["byggeTilbygg"];
        } else if (subType === "frittliggende") {
          selectedFeatures = ["byggeFrittliggende"];
        } else if (subType === "annet") {
          selectedFeatures = ["byggeAnnet"];
        }
      } else if (applicationData.subTypeId.startsWith("rive_")) {
        projectType = "Rive";
        const subType = applicationData.subTypeId.replace("rive_", "");
        if (subType === "tilbygg") {
          selectedFeatures = ["riveTilbygg"];
        } else if (subType === "frittliggende") {
          selectedFeatures = ["riveFrittliggende"];
        } else if (subType === "annet") {
          selectedFeatures = ["riveAnnet"];
        }
      }
    }

    const description =
      applicationData?.application_fields?.find(
        (f) => f.fieldName === "description",
      )?.fieldValue ?? "";

    setFormData({
      description,
      projectType,
      selectedFeatures,
    });
    setInitialDataLoaded(true);
  }, [applicationData, setFormData, initialDataLoaded]);

  useEffect(() => {
    if (externalFormData && externalSetFormData) {
      if (externalFormData.description !== formData.description) {
        externalSetFormData({
          description: formData.description,
        });
      }
    }
  }, [formData.description, externalFormData, externalSetFormData]);

  return (
    <div className="mx-auto mt-10 flex h-full w-full max-w-[900px] flex-col items-center justify-center">
      <h1 className="flex justify-center text-3xl font-bold">
        Hva vil du gjøre på eiendommen din?
      </h1>

      <div className="mt-4 w-full rounded-lg border-2 border-gray-400 p-4">
        <div className="flex flex-col gap-8 md:flex-row">
          <div className="w-full">
            <h1 className="font-medium">Hva gjelder tiltaket?</h1>
            <div className="mt-2 flex flex-col space-y-4">
              {options.map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer flex-col rounded-md border p-3 transition-all hover:bg-gray-100"
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="tiltak"
                      value={option.value}
                      checked={formData.projectType === option.value}
                      onChange={() => handleOptionChange(option.value)}
                      className="mr-2"
                    />
                    <span className="font-medium">{option.label}</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    {option.description}
                  </p>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 w-full rounded-lg border-2 border-gray-400 p-4">
        <h1 className="mb-2 inline-flex font-medium">
          Tegninger
          <Tooltip
            id="arealformål"
            content={tooltipInfo.arealFormål}
            isVisible={tooltip.isVisible("arealformål")}
            onMouseEnter={() => tooltip.handleMouseEnter("arealformål")}
            onMouseLeave={tooltip.handleMouseLeave}
          />
        </h1>

        {(formData.projectType === "Bygge" ||
          formData.projectType === "Rive") && (
          <div className="mb-4">
            <p className="mb-2 text-sm">
              Hva vil du {formData.projectType === "Bygge" ? "bygge" : "rive"}?
            </p>
            <div className="flex gap-4">
              {checkboxOptions[formData.projectType].map((option) => (
                <label
                  key={option.value}
                  className="flex items-start space-x-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={formData.selectedFeatures.includes(option.value)}
                    onChange={() => handleCheckboxChange(option.value)}
                    className="mt-1 rounded border-gray-300 text-kartAI-blue focus:ring-kartAI-blue"
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
            {formData.selectedFeatures.length === 0 && (
              <p className="mt-1 text-sm text-red-500">
                Velg minst ett alternativ
              </p>
            )}
          </div>
        )}

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

      <NavigationButtons
        backPath={determinedBackPath}
        nextPath={determinedNextPath}
        onBeforeNext={handleBeforeNext}
        isSaving={isUpdating}
        isNextDisabled={!isValid}
      />
    </div>
  );
};

export default ProjectType;
