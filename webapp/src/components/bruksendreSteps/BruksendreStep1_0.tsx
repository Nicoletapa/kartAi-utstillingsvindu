import React from "react";
import { ApplicationService } from "~/utils/api-service";
import { resolveFieldPath } from "~/utils/field-mappings";
import { tooltipInfo } from "~/utils/tooltipInfo";
import { useTooltip, Tooltip } from "../ui/ui-components";

interface BruksendreStep1_0Props {
  applicationID: number;
  formData: {
    internalStaircase: string;
    bearingWallsorConstructions: string;
    insertOrRemoveWindowOrDoor: string;
    otherPhysicalChanges: string;
    description: string;
    yesDispensationIsAttached: boolean;
    yesPermitsAreAttached: boolean;
    noDispensationNeeded: boolean;
  };
  setFormData: React.Dispatch<
    React.SetStateAction<{
      internalStaircase: string;
      bearingWallsorConstructions: string;
      insertOrRemoveWindowOrDoor: string;
      otherPhysicalChanges: string;
      description: string;
      yesDispensationIsAttached: boolean;
      yesPermitsAreAttached: boolean;
      noDispensationNeeded: boolean;
    }>
  >;
  onValidityChange: (isValid: boolean) => void;
}

const BruksendreStep1_0: React.FC<BruksendreStep1_0Props> = ({
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

  const handleFieldChange = (
    name: string,
    value: string | boolean | string[],
  ) => {
    const updatedFormData = {
      ...formData,
      [name]: value,
    };

    externalSetFormData((prev) => ({ ...prev, [name]: value }));
    checkFormValidity(updatedFormData);

    const fieldPath = resolveFieldPath(name, "sma-prosjekter");

    if (Array.isArray(value)) {
      void saveField(fieldPath, JSON.stringify(value));
    } else {
      void saveField(fieldPath, value.toString());
    }
  };

  const checkFormValidity = (data: typeof formData) => {
    const basicsFieldValid =
      (data.description?.trim() ?? "") !== "" &&
      (data.internalStaircase === "Ja" || data.internalStaircase === "Nei") &&
      (data.insertOrRemoveWindowOrDoor === "Ja" ||
        data.insertOrRemoveWindowOrDoor === "Nei") &&
      (data.otherPhysicalChanges === "Ja" ||
        data.otherPhysicalChanges === "Nei") &&
      (data.bearingWallsorConstructions === "Ja" ||
        data.bearingWallsorConstructions === "Nei");

    const dispensationOrOtherPermits =
      data.yesDispensationIsAttached ||
      data.yesPermitsAreAttached ||
      data.noDispensationNeeded;

    const isValid = basicsFieldValid && dispensationOrOtherPermits;
    onValidityChange(isValid);
  };

  const RadioField = ({ name, label }: { name: string; label: string }) => (
    <div className="mr-4 flex items-center justify-between">
      <span>{label}</span>
      <div className="flex gap-4">
        <label className="mr-4 items-center">
          <input
            type="radio"
            name={name}
            value="Ja"
            checked={formData[name as keyof typeof formData] === "Ja"}
            onChange={(e) => handleFieldChange(name, e.target.value)}
            className="mr-2"
          />
          Ja
        </label>
        <label className="items-center">
          <input
            type="radio"
            name={name}
            value="Nei"
            checked={formData[name as keyof typeof formData] === "Nei"}
            onChange={(e) => handleFieldChange(name, e.target.value)}
            className="mr-2"
          />
          Nei
        </label>
      </div>
    </div>
  );

  const CheckboxField = ({ name, label }: { name: string; label: string }) => (
    <label className="mr-4 flex items-center gap-x-2 whitespace-nowrap">
      <input
        type="checkbox"
        name={name}
        checked={formData[name as keyof typeof formData] as boolean}
        onChange={(e) => handleFieldChange(name, e.target.checked)}
      />
      {label}
    </label>
  );

  return (
    <div className="flex w-full flex-col justify-center">
      <h1 className="flex justify-center text-3xl font-bold">
        Hva vil du gjøre på eiendommen din?
      </h1>

      <div className="mt-4 min-h-28 w-full space-y-4 rounded-lg border-2 border-gray-400 p-4">
        <Tooltip
          title="Kryss av for endringene du vil gjøre:"
          id="checkboxChanges"
          content={tooltipInfo.checkboxChanges}
          isVisible={tooltip.isVisible("checkboxChanges")}
          onMouseEnter={tooltip.handleMouseEnter}
          onMouseLeave={tooltip.handleMouseLeave}
        />

        <RadioField
          name="internalStaircase"
          label="Skal du sette inn innvendig trapp?"
        />

        <RadioField
          name="bearingWallsorConstructions"
          label="Skal du endre på bærende vegg(er) eller bærende konstruksjoner?"
        />

        <RadioField
          name="insertOrRemoveWindowOrDoor"
          label="Skal du sette inn eller fjerne vindu eller dør i yttervegg?"
        />

        <RadioField
          name="otherPhysicalChanges"
          label="Skal du gjøre andre fysiske endringer av rommet/rommene?"
        />
      </div>

      <div className="mt-4 rounded-lg border-2 border-gray-400 p-4">
        <Tooltip
          title="Beskrivelse"
          id="description"
          content={tooltipInfo.description}
          isVisible={tooltip.isVisible("description")}
          onMouseEnter={tooltip.handleMouseEnter}
          onMouseLeave={tooltip.handleMouseLeave}
        />

        <textarea
          name="description"
          className="text-md mt-2 min-h-28 w-full rounded-lg border-2 border-gray-300 p-4"
          placeholder="Skriv her ..."
          value={formData.description}
          onChange={(e) => handleFieldChange(e.target.name, e.target.value)}
          required
        />
      </div>

      <div className="mt-4 h-fit w-full rounded-lg border-2 border-gray-400 p-4">
        <h2 className="mb-2 font-medium">
          Trenger du dispensasjon eller andre tilltatelser?
        </h2>

        <div className="flex flex-wrap gap-4">
          <CheckboxField
            name="yesDispensationIsAttached"
            label="Ja, men jeg har ikke søkt"
          />

          <CheckboxField
            name="yesPermitsAreAttached"
            label="Ja, jeg har søknad/tillatelse/vedtak"
          />

          <CheckboxField
            name="noDispensationNeeded"
            label="Nei, jeg trenger ikke"
          />
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

export default BruksendreStep1_0;
