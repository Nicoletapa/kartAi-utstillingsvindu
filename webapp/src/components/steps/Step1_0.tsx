"use client";
import React, { useRef, useCallback, useEffect, useMemo } from "react";
import { Tooltip, useTooltip } from "../ui/ui-components";
import { tooltipInfo } from "~/utils/tooltipInfo";
import { ApplicationService } from "~/utils/api-service";
import { resolveFieldPath } from "~/utils/field-mappings";
import TiltaksAidMap from "../TiltaksAidMap";
import { type Map } from "leaflet";
import { usePropertySearch } from "~/hooks/usePropertySearch";
import type { SpatialAnalysisResult } from "~/utils/propertyUtils";

interface Step1_0Props {
  applicationID: number;
  formData: {
    municipalPlan: boolean;
    regulationPlan: boolean;
    regulationPlanDetails: string;
    otherPlans: boolean;
    otherPlansDetails: string;
    yesDispensationIsAttached: boolean;
    yesPermitsAreAttached: boolean;
    noDispensationNeeded: boolean;
  };
  setFormData: React.Dispatch<
    React.SetStateAction<{
      municipalPlan: boolean;
      regulationPlan: boolean;
      regulationPlanDetails: string;
      otherPlans: boolean;
      otherPlansDetails: string;
      yesDispensationIsAttached: boolean;
      yesPermitsAreAttached: boolean;
      noDispensationNeeded: boolean;
    }>
  >;
  onValidityChange: (isValid: boolean) => void;
}

const Step1_0: React.FC<Step1_0Props> = ({
  applicationID,
  formData,
  setFormData: externalSetFormData,
  onValidityChange,
}) => {
  const { saveField, isSaving } = ApplicationService.useSaveFormData(
    applicationID,
    "sma-prosjekter",
  );

  const tooltip = useTooltip();

  const { userData } = usePropertySearch();

  const mapRef = useRef<Map | null>(null);

  const safeFormData = useMemo(
    () => ({
      municipalPlan: formData.municipalPlan ?? false,
      regulationPlan: formData.regulationPlan ?? false,
      regulationPlanDetails: formData.regulationPlanDetails || "",
      otherPlans: formData.otherPlans ?? false,
      otherPlansDetails: formData.otherPlansDetails || "",
      yesDispensationIsAttached: formData.yesDispensationIsAttached ?? false,
      yesPermitsAreAttached: formData.yesPermitsAreAttached ?? false,
      noDispensationNeeded: formData.noDispensationNeeded ?? false,
    }),
    [
      formData.municipalPlan,
      formData.regulationPlan,
      formData.regulationPlanDetails,
      formData.otherPlans,
      formData.otherPlansDetails,
      formData.yesDispensationIsAttached,
      formData.yesPermitsAreAttached,
      formData.noDispensationNeeded,
    ],
  );

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFieldChange(e.target.name, e.target.checked);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    handleFieldChange(e.target.name, e.target.value);
  };

  const checkFormValidity = useCallback(
    (data: typeof safeFormData) => {
      const basicsFieldValid =
        data.municipalPlan ||
        (data.otherPlans && data.otherPlansDetails.trim() !== "") ||
        (data.regulationPlan && data.regulationPlanDetails.trim() !== "");

      const dispensationOrOtherPermits =
        data.yesDispensationIsAttached ||
        data.yesPermitsAreAttached ||
        data.noDispensationNeeded;

      const isValid = basicsFieldValid && dispensationOrOtherPermits;
      onValidityChange(isValid);
    },
    [onValidityChange],
  );

  useEffect(() => {
    checkFormValidity(safeFormData);
  }, [safeFormData, checkFormValidity]);

  const handleFieldChange = (
    name: string,
    value: string | boolean | string[],
  ) => {
    externalSetFormData((prev) => ({ ...prev, [name]: value }));

    const fieldPath = resolveFieldPath(name, "sma-prosjekter");

    try {
      if (Array.isArray(value)) {
        void saveField(fieldPath, JSON.stringify(value));
      } else {
        void saveField(fieldPath, value.toString());
      }
      console.log(`Successfully saved field: ${name}`);
    } catch (error) {
      console.error(`Error saving field ${name}:`, error);
    }
  };

  const handleMapReady = useCallback((map: Map) => {
    if (!mapRef.current) {
      mapRef.current = map;
    }
  }, []);

  const handleShapeDrawn = useCallback(
    (shape: GeoJSON.Feature, analysis?: SpatialAnalysisResult) => {
      console.log("Shape drawn in BruksendreStep1_1:", shape);
      if (analysis) {
        console.log(
          "Spatial analysis received in BruksendreStep1_1:",
          analysis,
        );
      }
    },
    [],
  );

  return (
    <div className="flex w-full flex-col justify-center">
      <h1 className="flex justify-center text-3xl font-bold">
        Planer & Regelverk
      </h1>
      <div className="mt-4 rounded-lg border-2 border-gray-400">
        <div className="relative z-10 max-h-80 overflow-hidden rounded-lg">
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
      <div className="mt-4 rounded-lg border-2 border-gray-400 p-4">
        <Tooltip
          id="buildingDetails"
          title="Hvilke kommunale planer gjelder for din eiendom?"
          content={tooltipInfo.municipalPlan}
          isVisible={tooltip.isVisible("buildingDetails")}
          onMouseEnter={tooltip.handleMouseEnter}
          onMouseLeave={tooltip.handleMouseLeave}
        />

        <p>
          Du kan bestille disse fra kommunen, eller finne dem på kommunens
          nettside. <br />
          Flere kryss kan være nødvendig:
        </p>
        <div className="ml-8 mt-2 flex flex-col gap-4">
          <label className="flex h-8 items-center gap-x-2">
            <input
              type="checkbox"
              name="municipalPlan"
              checked={safeFormData.municipalPlan}
              onChange={handleCheckboxChange}
              className="h-4 w-4"
            />
            <span>Kommuneplan</span>
          </label>

          <div className="flex items-center gap-x-2">
            <label className="flex h-8 items-center gap-x-2">
              <input
                type="checkbox"
                name="regulationPlan"
                checked={safeFormData.regulationPlan}
                onChange={handleCheckboxChange}
                className="h-4 w-4"
              />
              <span className="w-32">Reguleringsplan</span>
            </label>
            <input
              type="text"
              name="regulationPlanDetails"
              value={safeFormData.regulationPlanDetails}
              onChange={handleInputChange}
              placeholder="Navn/nummer på plan"
              className="w-64 rounded border px-2 py-1 text-sm"
              required
            />
          </div>

          <div className="flex items-center gap-x-2">
            <label className="flex h-8 items-center gap-x-2">
              <input
                type="checkbox"
                name="otherPlans"
                checked={safeFormData.otherPlans}
                onChange={handleCheckboxChange}
                className="h-4 w-4"
              />
              <span className="w-32">Andre planer</span>
            </label>
            <input
              type="text"
              name="otherPlansDetails"
              value={safeFormData.otherPlansDetails}
              onChange={handleInputChange}
              placeholder="Navn/nummer på pan"
              className="w-64 rounded border px-2 py-1 text-sm"
              required
            />
          </div>
        </div>
      </div>
      <div className="mt-2 h-fit w-full rounded-lg border-2 border-gray-400 p-4">
        <h2 className="mb-2 font-medium">
          Trenger du dispensasjon eller andre tilltatelser?
        </h2>
        <div className="flex flex-wrap gap-4">
          <label className="mr-4 flex items-center gap-x-2 whitespace-nowrap">
            <input
              type="checkbox"
              name="yesDispensationIsAttached"
              checked={formData.yesDispensationIsAttached}
              onChange={handleCheckboxChange}
            />
            Ja, men jeg har ikke søkt
          </label>

          <label className="mr-4 flex items-center gap-x-2 whitespace-nowrap">
            <input
              type="checkbox"
              name="yesPermitsAreAttached"
              checked={formData.yesPermitsAreAttached}
              onChange={handleCheckboxChange}
            />
            Ja, jeg har søknad/tillatelse/vedtak
          </label>

          <label className="flex items-center gap-x-2 whitespace-nowrap">
            <input
              type="checkbox"
              name="noDispensationNeeded"
              checked={formData.noDispensationNeeded}
              onChange={handleCheckboxChange}
            />
            Nei, jeg trenger ikke
          </label>
        </div>
        {(formData.yesDispensationIsAttached ||
          formData.yesPermitsAreAttached) && (
          <div
            className="mt-4 rounded-lg border p-3 text-sm"
            style={{
              backgroundColor: formData.yesDispensationIsAttached
                ? "#fefce8"
                : "#eff6ff",
              borderColor: formData.yesDispensationIsAttached
                ? "#fef08a"
                : "#bfdbfe",
            }}
          >
            {formData.yesDispensationIsAttached && (
              <p className="text-yellow-800">
                Du kan søke om dispensasjon i senere steg i prosessen.
              </p>
            )}
            {formData.yesPermitsAreAttached && (
              <p className="text-blue-800">
                Vennligst last opp dokumentasjonen din i senere steg. Du må ha
                vedlegg som bekrefter at du har nødvendige tillatelser for å
                gjennomføre endringene.
              </p>
            )}
          </div>
        )}
      </div>
      {isSaving && (
        <div className="fixed bottom-4 right-4 z-10 rounded-full bg-white p-2 shadow-md">
          <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
};

export default Step1_0;
