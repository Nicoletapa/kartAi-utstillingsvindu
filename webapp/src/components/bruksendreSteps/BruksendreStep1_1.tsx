import React, { useEffect, useCallback, useRef } from "react";
import { ApplicationService } from "~/utils/api-service";

import { Tooltip, useTooltip } from "~/components/ui/ui-components";
import { RadioGroup } from "~/components/ui/radio-button";
import TiltaksAidMap from "../TiltaksAidMap";
import { usePropertySearch } from "~/hooks/usePropertySearch";
import type { SpatialAnalysisResult } from "~/utils/propertyUtils";
import { Loader2 } from "lucide-react";
import type { Map } from "leaflet";
import { drivewayOptions, yesNoOptions } from "~/types/formTypes";

type FormDataType = {
  neighboringBorder: string;
  powerLine: string;
  dangerZone: string;
  protectedBuilding: string;
  drivewayChanges: string;
  road_type: string;
};

const defaultValues: FormDataType = {
  neighboringBorder: "",
  powerLine: "",
  dangerZone: "",
  protectedBuilding: "",
  drivewayChanges: "",
  road_type: "",
};

interface BruksendreStep1_1Props {
  applicationID: number;
  formData: FormDataType;
  setFormData: React.Dispatch<React.SetStateAction<FormDataType>>;
  onValidityChange: (isValid: boolean) => void;
}

const BruksendreStep1_1: React.FC<BruksendreStep1_1Props> = ({
  applicationID,
  formData: externalFormData,
  setFormData: externalSetFormData,
  onValidityChange,
}) => {
  const formData = { ...defaultValues, ...externalFormData };

  const tooltip = useTooltip();

  const { saveField, isSaving } = ApplicationService.useSaveFormData(
    applicationID,
    "bruksendring",
  );
  const { userData } = usePropertySearch();

  const mapRef = useRef<Map | null>(null);

  const checkFormValidity = useCallback(
    (data: typeof formData) => {
      const basicFieldsValid =
        (data.neighboringBorder?.trim() ?? "") !== "" &&
        (data.dangerZone?.trim() ?? "") !== "" &&
        (data.protectedBuilding?.trim() ?? "") !== "" &&
        (data.drivewayChanges === "Ja" || data.drivewayChanges === "Nei") &&
        (data.powerLine?.trim() ?? "") !== "";

      const drivewayValid =
        data.drivewayChanges === "Nei" || data.road_type !== "";

      const isValid = basicFieldsValid && drivewayValid;
      onValidityChange(isValid);
      return isValid;
    },
    [onValidityChange],
  );

  const handleFieldChange = (name: string, value: string | boolean) => {
    externalSetFormData((prev) => ({ ...prev, [name]: value }));
    void saveField(name, value.toString());
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    handleFieldChange(e.target.name, e.target.value);
  };

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFieldChange(e.target.name, e.target.value);
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
  const tooltips = {
    shortestDistance: "Skriv inn korteste avstand.",
    conflictsWithSurroundings: "konflikt",
    driveway:
      "Hvis byggeprosjektet vil føre til en ny eller endret avkjørsel til eiendommen, må du søke om tillatelse fra Statens vegvesen eller kommunen.",
  };

  useEffect(() => {
    checkFormValidity(formData);
  }, [externalFormData, checkFormValidity, formData]);

  return (
    <div className="flex w-full flex-col justify-center">
      <h1 className="flex justify-center text-3xl font-bold">
        Detaljer til det du vil gjøre
      </h1>

      <section className="mt-4 rounded-lg border-2 border-gray-400">
        <div className="flex flex-col md:flex-row">
          <div className="h-72 w-full p-4 md:w-3/6">
            <h2 className="inline-flex font-medium">
              Korteste avstand
              <Tooltip
                id="shortestDistance"
                content={tooltips.shortestDistance}
                isVisible={tooltip.isVisible("shortestDistance")}
                onMouseEnter={tooltip.handleMouseEnter}
                onMouseLeave={tooltip.handleMouseLeave}
              />
            </h2>

            <p className="text-sm italic">
              Bruk situasjonskartet og mål opp korteste avstand fra
              rommet/rommene du skal endre til:
            </p>

            <form className="mt-4 space-y-4">
              <div>
                <label className="mb-1 mr-1 text-sm font-medium text-gray-700">
                  Nabogrense:
                </label>
                <input
                  type="number"
                  name="neighboringBorder"
                  placeholder="F.eks. 4"
                  className="required h-8 w-20 border-b-2 border-gray-400 bg-gray-100 p-2 text-sm outline-none"
                  value={formData.neighboringBorder}
                  onChange={handleInputChange}
                  required
                />
                <span className="ml-2 text-sm">meter</span>
              </div>
            </form>
          </div>

          <div className="w-full md:w-3/6 md:border-l-2 md:border-gray-400">
            <div className="no-rounded-map relative z-0 max-h-96 overflow-hidden">
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
        </div>
      </section>

      <section className="mt-4 min-h-28 w-full rounded-lg border-2 border-gray-400 p-4">
        <h2 className="inline-flex font-medium">
          Kan bruksendringene være i konflikt med omgivelsene?
          <Tooltip
            id="conflictsWithSurroundings"
            content={tooltips.conflictsWithSurroundings}
            isVisible={tooltip.isVisible("conflictsWithSurroundings")}
            onMouseEnter={tooltip.handleMouseEnter}
            onMouseLeave={tooltip.handleMouseLeave}
          />
        </h2>
        <p className="mb-2 text-sm italic">
          Svarer du ja på noen av disse må du legge ved søknad om dispensasjon
          eller tillatelse/vedtak.
        </p>

        <div className="space-y-4">
          <RadioGroup
            name="powerLine"
            label="Er rommet/rommene du skal bruksendre i nærheten av høyspent kraftlinje?"
            options={yesNoOptions}
            value={formData.powerLine}
            onChange={handleRadioChange}
          />

          <RadioGroup
            name="dangerZone"
            label="Bruksendrer du i et flom-, ras- eller skredsutsatt område?"
            options={yesNoOptions}
            value={formData.dangerZone}
            onChange={handleRadioChange}
          />

          <RadioGroup
            name="protectedBuilding"
            label="Er bygningen du skal bruksendre verneverdig eller et kulturminne?"
            options={yesNoOptions}
            value={formData.protectedBuilding}
            onChange={handleRadioChange}
          />
        </div>
      </section>

      <section className="mt-4 rounded-lg border-2 border-gray-400 p-4">
        <h2 className="mb-2 inline-flex font-medium">
          Vil byggeprosjektet føre til en ny/endret avkjøring til eiendommen?
          <Tooltip
            id="driveway"
            content={tooltips.driveway}
            isVisible={tooltip.isVisible("driveway")}
            onMouseEnter={tooltip.handleMouseEnter}
            onMouseLeave={tooltip.handleMouseLeave}
          />
        </h2>

        <div className="flex gap-4">
          {yesNoOptions.map((option) => (
            <label key={option.value} className="items-center">
              <input
                type="radio"
                name="drivewayChanges"
                value={option.value}
                checked={formData.drivewayChanges === option.value}
                onChange={handleRadioChange}
                className="mr-2"
              />
              {option.label}
            </label>
          ))}
        </div>

        {formData.drivewayChanges === "Ja" && (
          <div className="mt-4 gap-2">
            <h1 className="text-md text-gray font-medium">
              Eiendommen vil få ny/endret avkjørsel til (velg én):
            </h1>
            <div className="ml-8 mt-2 flex flex-col gap-2">
              {drivewayOptions.map((option) => (
                <label key={option.value} className="flex items-center gap-x-2">
                  <input
                    type="radio"
                    name="road_type"
                    value={option.value}
                    checked={formData.road_type === option.value}
                    onChange={handleRadioChange}
                  />
                  {option.label}
                </label>
              ))}
            </div>
            <p className="mt-4 italic">
              Du vil få muligheten til å legge til vedlegg som viser at du har
              avkjøringstillatelse fra Statens vegvesen eller kommunen, eller/og
              veirett gjennom tinglyst erklæring i senere steg.
            </p>
          </div>
        )}
      </section>

      {isSaving && (
        <div className="fixed bottom-4 right-4 z-10 rounded-full bg-white p-2 shadow-md">
          <Loader2 className="animate-spin text-gray-500" size={24} />
        </div>
      )}
    </div>
  );
};

export default BruksendreStep1_1;
