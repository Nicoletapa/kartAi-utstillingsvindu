/**
 * This file is used in Utstillingsvindu 2.0
 *
 * @description
 * Renders and displays the applicant and property information section
 * within a multi-step application form. It fetches application data and
 * user's session details for display. Includes a selector for the current property.
 */

import React, { useState, useEffect, useMemo } from "react";
import { api } from "~/trpc/react";
import { useSession } from "next-auth/react";
import { ApplicationService } from "~/utils/api-service";
import { Tooltip, useTooltip } from "~/components/ui/ui-components";
import { LoadingIndicator } from "./ui/loading-indicator";
import { tooltipInfo } from "~/utils/tooltipInfo";
import { NavigationButtons } from "./NavigationButtons";
import { DisplayFields } from "./ui/fields";
import {
  getPersonalDataFields,
  getPropertyDataFields,
  getOwnerDataFields,
  createPropertyOption,
  extractDisplayData,
  type UserDetails,
  type CurrentPropertyOption,
} from "~/utils/applicant-details-config";

interface StepApplicantDetailsProps {
  applicationID?: number;
  onValidityChange: (isValid: boolean) => void;
}

const Step_applicant_details: React.FC<StepApplicantDetailsProps> = ({
  applicationID,
  onValidityChange,
}) => {
  const { data: session } = useSession();
  const tooltip = useTooltip();

  const { data: applicationFromDB, isLoading: isLoadingApplication } =
    ApplicationService.getApplication(applicationID ?? 0);

  const { data: userDetails, isLoading: isLoadingUserDetails } =
    api.user.getUserDetails.useQuery(undefined, { enabled: !!session }) as {
      data: UserDetails | null | undefined;
      isLoading: boolean;
    };

  const [isDataSufficient, setIsDataSufficient] = useState(false);
  const [currentPropertyOption, setCurrentPropertyOption] =
    useState<CurrentPropertyOption | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string>("");

  const {
    personalDataForDisplay,
    propertyDataForDisplay,
    ownerDataForDisplay,
    ownerNameForDisplay,
    rawPropertyObjectForSelector,
  } = useMemo(() => {
    const fieldsMap: Record<string, string | undefined> = {};
    applicationFromDB?.application_fields?.forEach((field) => {
      fieldsMap[field.fieldName] = field.fieldValue;
    });

    const displayData = extractDisplayData(fieldsMap, userDetails);

    return {
      personalDataForDisplay: getPersonalDataFields(displayData),
      propertyDataForDisplay: getPropertyDataFields(displayData),
      ownerDataForDisplay: getOwnerDataFields(userDetails),
      ownerNameForDisplay: userDetails?.name ?? "Ikke angitt",
      rawPropertyObjectForSelector: displayData.property,
    };
  }, [applicationFromDB, userDetails]);

  useEffect(() => {
    const option = createPropertyOption(rawPropertyObjectForSelector);
    if (option) {
      setCurrentPropertyOption(option);
      setSelectedOptionId(option.id);
    } else {
      setCurrentPropertyOption(null);
      setSelectedOptionId("");
    }
  }, [rawPropertyObjectForSelector]);

  useEffect(() => {
    const hasApplicantName = !!(
      applicationFromDB?.application_fields?.find(
        (f) => f.fieldName === "applicant.name",
      )?.fieldValue ?? userDetails?.name
    );

    const hasValidProperty = !!currentPropertyOption?.address;

    const sufficient = hasApplicantName && hasValidProperty;
    setIsDataSufficient(sufficient);
    onValidityChange(sufficient);
  }, [applicationFromDB, userDetails, currentPropertyOption, onValidityChange]);

  const determinedNextPath = applicationID
    ? `/atlas-app/i-soknad/${applicationID}/hva-vil-du-gjore`
    : undefined;
  const determinedBackPath = applicationID
    ? `/atlas-app/sidebar/soknader`
    : "/atlas-app/i-soknad";

  // Handler for the selector change (mostly a no-op if only one option)
  const handlePropertySelectorChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setSelectedOptionId(event.target.value);
  };

  if ((isLoadingApplication && applicationID) || isLoadingUserDetails) {
    return <LoadingIndicator text={"Laster data..."} />;
  }

  return (
    <div className="mt-16 flex h-full flex-col items-center justify-center">
      <h1 className="flex justify-center text-3xl font-bold">
        Dine opplysninger
      </h1>

      <div
        className="mt-4 rounded-lg border-2 border-gray-400 p-4 lg:w-[950px]"
        data-cy="main-container"
      >
        <div className="flex flex-col gap-8 md:flex-row">
          <div className="w-full md:w-2/6" data-cy="left-column">
            <h1 className="mb-4 font-medium">Personopplysninger</h1>
            <DisplayFields fields={personalDataForDisplay} />
          </div>

          <div
            className="w-full md:w-4/6 md:border-l-2 md:border-gray-400 md:pl-8"
            data-cy="right-column"
          >
            {/* --- PROPERTY SELECTOR WITH TOOLTIP AS LABEL --- */}
            {currentPropertyOption && (
              <div className="mb-6">
                <Tooltip
                  id="propertySelectorTooltip"
                  title="Gjeldende eiendom for søknaden"
                  content={tooltipInfo.property}
                  isVisible={tooltip.isVisible("propertySelectorTooltip")}
                  onMouseEnter={() =>
                    tooltip.handleMouseEnter("propertySelectorTooltip")
                  }
                  onMouseLeave={tooltip.handleMouseLeave}
                />
                <select
                  id="current-property-select"
                  name="current-property-select"
                  aria-labelledby="propertySelectorTooltip"
                  className="mt-1 block w-full rounded-md border-gray-400 px-3 py-2 text-base shadow-md focus:outline-none focus:ring-2 focus:ring-kartAI-blue focus:ring-offset-2 sm:text-sm"
                  value={selectedOptionId}
                  onChange={handlePropertySelectorChange}
                >
                  <option
                    key={currentPropertyOption.id}
                    value={currentPropertyOption.id}
                  >
                    {currentPropertyOption.address} (Gnr:{" "}
                    {currentPropertyOption.property_number}, Bnr:{" "}
                    {currentPropertyOption.usage_number})
                  </option>
                </select>
              </div>
            )}
            {/* --- END PROPERTY SELECTOR --- */}

            {/* Spacing adjustment if selector is present */}
            <div
              className={`mt-2 flex flex-col space-y-2 ${
                currentPropertyOption ? "border-t border-gray-300 pt-4" : ""
              }`}
            >
              <h1 className="font-medium">Eiendomsinformasjon</h1>
              <div className="flex w-full flex-col md:flex-row md:gap-8">
                <div className="flex-1 space-y-2">
                  <DisplayFields fields={propertyDataForDisplay} />
                </div>
                <div className="flex-1 space-y-2">
                  <h1 className="font-medium">Eies av:</h1>
                  <div>{ownerNameForDisplay}</div>
                  <DisplayFields fields={ownerDataForDisplay} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <NavigationButtons
        backPath={determinedBackPath}
        nextPath={determinedNextPath}
        isSaving={false}
        isNextDisabled={!isDataSufficient || !determinedNextPath}
      />
    </div>
  );
};

export default Step_applicant_details;
