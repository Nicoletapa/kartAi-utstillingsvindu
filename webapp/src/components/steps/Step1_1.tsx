import React, { useCallback, useEffect } from "react";
import { ApplicationService } from "~/utils/api-service";
import { resolveFieldPath } from "~/utils/field-mappings";
import {
  smaProsjekterDefaultValues,
  yesNoOptions,
  drivewayOptions,
} from "~/types/formTypes";
import { Tooltip, useTooltip } from "../ui/ui-components";
import { RadioGroup } from "../ui/radio-button";
import type { SmaProsjekterFormData } from "~/types/formTypes";
import { tooltipInfo } from "~/utils/tooltipInfo";
import {
  buildingDensityInputs,
  buildingInputs,
  calculationMethodOptions,
  distanceInputs,
  environmentalConflictGroups,
  smaProsjekterStep1_1Schema,
} from "~/utils/step1_1-config";

interface Step1_1Props {
  applicationID: number;
  formData: SmaProsjekterFormData;
  setFormData: React.Dispatch<React.SetStateAction<SmaProsjekterFormData>>;
  onValidityChange: (isValid: boolean) => void;
}

const Step1_1: React.FC<Step1_1Props> = ({
  applicationID,
  formData: externalFormData,
  setFormData: externalSetFormData,
  onValidityChange,
}) => {
  const { saveField, isSaving } = ApplicationService.useSaveFormData(
    applicationID,
    "sma-prosjekter",
  );
  const tooltip = useTooltip();

  const formDataForDisplay = {
    ...smaProsjekterDefaultValues,
    ...externalFormData,
  };

  const checkFormValidity = useCallback(
    (data: SmaProsjekterFormData) => {
      const validationResult = smaProsjekterStep1_1Schema.safeParse(data);
      const isValid = validationResult.success;
      onValidityChange(isValid);

      if (!isValid) {
        console.log("Valideringsfeil:", validationResult.error.flatten());
      }
      return isValid;
    },
    [onValidityChange],
  );

  const handleFieldChange = (
    name: string,
    value: string | boolean | string[],
  ) => {
    const newExternalState = { ...externalFormData, [name]: value };
    externalSetFormData(newExternalState);

    checkFormValidity(newExternalState);

    const fieldPath = resolveFieldPath(name, "sma-prosjekter");

    try {
      if (Array.isArray(value)) {
        void saveField(fieldPath, JSON.stringify(value));
      } else {
        void saveField(fieldPath, value.toString());
      }
    } catch (error) {
      console.error(`Error saving field ${fieldPath}:`, error);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    handleFieldChange(e.target.name, e.target.value);
  };

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFieldChange(e.target.name, e.target.value);
  };

  const handleCalculationMethodChange = (method: string) => {
    // Bruk externalFormData for å bygge den nye verdien
    const currentMethods = externalFormData.calculation_method || [];

    const updatedMethods = currentMethods.includes(method)
      ? currentMethods.filter((v) => v !== method)
      : [...currentMethods, method];

    handleFieldChange("calculation_method", updatedMethods);
  };

  useEffect(() => {
    checkFormValidity(externalFormData);
  }, [checkFormValidity, externalFormData]); // Legg til externalFormData hvis den kan endres etter mount

  return (
    <div className="flex w-full flex-col justify-center">
      <h1 className="flex justify-center text-3xl font-bold">
        Detaljer til det du vil gjøre
      </h1>

      <div
        className="mt-4 rounded-lg border-2 border-gray-400 p-4"
        data-cy="main-container"
      >
        <div className="flex flex-col md:flex-row">
          <div className="w-full md:w-3/6" data-cy="left-column">
            <Tooltip
              id="buildingDetails"
              title="Bygningdetaljer"
              content={tooltipInfo.buildingDetails}
              isVisible={tooltip.isVisible("buildingDetails")}
              onMouseEnter={tooltip.handleMouseEnter}
              onMouseLeave={tooltip.handleMouseLeave}
            />

            <form className="mt-4">
              {buildingInputs.map((input) => (
                <div key={input.name}>
                  <label className="mb-1 mr-1 text-sm font-medium text-gray-700">
                    {input.label}
                  </label>
                  <input
                    type="number"
                    name={input.name}
                    placeholder={input.placeholder}
                    className="mb-2 h-8 w-24 border-b-2 border-gray-400 bg-gray-100 p-2 text-sm outline-none"
                    value={
                      formDataForDisplay[
                        input.name as keyof typeof formDataForDisplay
                      ] as string
                    }
                    onChange={handleInputChange}
                    required
                  />
                  <span className="ml-2 text-sm">{input.unit}</span>
                </div>
              ))}

              <Tooltip
                id="shortestDistance"
                title="Korteste avstand"
                content={tooltipInfo.shortestDistance}
                isVisible={tooltip.isVisible("shortestDistance")}
                onMouseEnter={tooltip.handleMouseEnter}
                onMouseLeave={tooltip.handleMouseLeave}
              />

              <p className="mb-2 text-sm italic">
                Bruk situasjonskartet og mål opp korteste avstand fra
                rommet/rommene du skal endre til:
              </p>

              {distanceInputs.map((input) => (
                <div key={input.name}>
                  <label className="mb-1 mr-1 text-sm font-medium text-gray-700">
                    {input.label}
                  </label>
                  <input
                    type="number"
                    name={input.name}
                    placeholder={input.placeholder}
                    className="required mb-2 h-8 w-24 border-b-2 border-gray-400 bg-gray-100 p-2 text-sm outline-none"
                    value={
                      formDataForDisplay[
                        input.name as keyof typeof formDataForDisplay
                      ] as string
                    }
                    onChange={handleInputChange}
                    required
                  />
                  <span className="ml-2 text-sm">{input.unit}</span>
                </div>
              ))}
            </form>
          </div>

          <div
            className="w-full md:w-3/6 md:border-l-2 md:border-gray-400 md:pl-8"
            data-cy="right-column"
          >
            <Tooltip
              id="calculationMethod"
              title="Beregningsmåte"
              content={tooltipInfo.calculationMethod}
              isVisible={tooltip.isVisible("calculationMethod")}
              onMouseEnter={tooltip.handleMouseEnter}
              onMouseLeave={tooltip.handleMouseLeave}
            />

            <p className="mb-2 text-sm italic">
              Hva er beregningsmåten for grad av utnytting for eiendommen din?
              (Velg minst én){" "}
            </p>

            <div className="space-y-2">
              {calculationMethodOptions.map((method) => {
                return (
                  <div key={method.value} className="flex items-start">
                    <input
                      type="checkbox"
                      id={`calc-method-${method.value}`}
                      checked={(
                        formDataForDisplay.calculation_method || []
                      ).includes(method.value)}
                      onChange={() =>
                        handleCalculationMethodChange(method.value)
                      }
                      className="mr-2 mt-1"
                    />
                    <label
                      htmlFor={`calc-method-${method.value}`}
                      className="flex flex-col"
                    >
                      <span>
                        {method.label} {method.value}
                      </span>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-lg border-2 border-gray-400 p-4">
        <Tooltip
          id="buildingDensity"
          title="Utnyttingsgrad"
          content={tooltipInfo.buildingDensity}
          isVisible={tooltip.isVisible("buildingDensity")}
          onMouseEnter={tooltip.handleMouseEnter}
          onMouseLeave={tooltip.handleMouseLeave}
        />

        <p className="mb-1 text-sm">
          Oppgi arealet til alle bygninger på eiendommen din, og regn ut ny grad
          av utnytting.
        </p>
        <p className="mb-4 text-sm font-medium italic">
          Bruk den beregningsmåten du krysset av for over.
        </p>

        <div className="space-y-4">
          {buildingDensityInputs.map((input) => (
            <div key={input.name} className="flex items-center">
              <label className="w-[300px] text-sm font-medium text-gray-700">
                {input.label}
              </label>
              <input
                type="text"
                name={input.name}
                className="ml-20 h-8 w-72 rounded border border-gray-400 p-2 text-sm"
                value={
                  formDataForDisplay[
                    input.name as keyof typeof formDataForDisplay
                  ] as string
                }
                onChange={handleInputChange}
                required
              />
              {input.unit && <span className="ml-2 text-sm">{input.unit}</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 min-h-28 w-full space-y-4 rounded-lg border-2 border-gray-400 p-4">
        <h2 className="inline-flex font-medium">
          Kan byggeplanene dine være i konflikt med omgivelsene?
          <Tooltip
            id="conflictWithSurroundings"
            content={tooltipInfo.conflictWithSurroundings}
            isVisible={tooltip.isVisible("conflictWithSurroundings")}
            onMouseEnter={tooltip.handleMouseEnter}
            onMouseLeave={tooltip.handleMouseLeave}
          />
        </h2>
        <p className="text-sm italic">
          Svarer du ja på noen av disse, må du legge ved tillatelse eller
          uttalelse fra eier.
        </p>

        {environmentalConflictGroups[0]!.map((item) => (
          <RadioGroup
            key={item.name}
            name={item.name}
            label={item.label}
            options={yesNoOptions}
            value={
              formDataForDisplay[
                item.name as keyof typeof formDataForDisplay
              ] as string
            }
            onChange={handleRadioChange}
          />
        ))}

        <div className="border border-gray-300" />
        <p className="text-sm italic">
          Svarer du ja på noen av disse, må du legge ved tillatelse eller
          uttalelse fra eier.
        </p>

        {environmentalConflictGroups[1]!.map((item) => (
          <RadioGroup
            key={item.name}
            name={item.name}
            label={item.label}
            options={yesNoOptions}
            value={
              formDataForDisplay[
                item.name as keyof typeof formDataForDisplay
              ] as string
            }
            onChange={handleRadioChange}
          />
        ))}
      </div>

      <div className="mt-4 rounded-lg border-2 border-gray-400 p-4">
        <h2 className="mb-2 inline-flex font-medium">
          Vil byggeprosjektet føre til en ny/endret avkjøring til eiendommen?
          <Tooltip
            id="driveway"
            content={tooltipInfo.driveway}
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
                name="new_driveway"
                value={option.value}
                checked={formDataForDisplay.new_driveway === option.value}
                onChange={handleRadioChange}
                className="mr-2"
              />
              {option.label}
            </label>
          ))}
        </div>

        {formDataForDisplay.new_driveway === "Ja" && (
          <div className="mt-4 gap-2">
            <h1 className="text-md text-gray font-medium">
              Eiendommen vil få ny/endret avkjørsel til (sett kryss):
            </h1>
            <div className="ml-8 mt-2 flex flex-col gap-2">
              {drivewayOptions.map((option) => (
                <label key={option.value} className="flex items-center gap-x-2">
                  <input
                    type="radio"
                    name="road_type"
                    value={option.value}
                    checked={formDataForDisplay.road_type === option.value}
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
      </div>

      <div className="mt-4 rounded-lg border-2 border-gray-400 p-4">
        <h2 className="mb-2 font-medium">
          Er tiltaket i samsvar med gjeldende plan?
        </h2>

        <div className="flex gap-4">
          {yesNoOptions.map((option) => (
            <label key={option.value} className="items-center">
              <input
                type="radio"
                name="planCompliance"
                value={option.value}
                checked={formDataForDisplay.planCompliance === option.value}
                onChange={handleRadioChange}
                className="mr-2"
              />
              {option.label}
            </label>
          ))}
        </div>

        {formDataForDisplay.planCompliance === "Nei" && (
          <div className="mt-4">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Begrunn hvorfor tiltaket ikke er i samsvar med gjeldende plan:
            </label>
            <textarea
              name="nonComplianceReason"
              rows={3}
              className="w-full rounded-md border border-gray-300 p-2"
              value={formDataForDisplay.nonComplianceReason}
              onChange={handleInputChange}
            />
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

export default Step1_1;
