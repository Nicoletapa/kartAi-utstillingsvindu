import React, { useEffect } from 'react';
import { ApplicationService, UIComponents } from '~/utils/api-service';
import { resolveFieldPath } from '~/utils/field-mappings';
import {  
  smaProsjekterDefaultValues, 
  ROAD_TYPES, 
  CALCULATION_METHODS,
  yesNoOptions 
} from '~/types/formTypes';
import { RadioGroup, Tooltip } from '../ui/ui-components';
import type {SmaProsjekterFormData} from '~/types/formTypes';

// Building measurement inputs
const buildingInputs = [
  { name: 'size', label: 'Størrelse:', placeholder: 'F.eks. 24', unit: 'm²' },
  { name: 'mønehøyde', label: 'Mønehøyde:', placeholder: 'F.eks. 4.5', unit: 'meter' },
  { name: 'gesimshøyde', label: 'Gesimshøyde:', placeholder: 'F.eks. 3.5', unit: 'meter' },
  { name: 'distance_va', label: 'Avstand til VA-ledninger:', placeholder: 'F.eks. 4', unit: 'meter' },
  { name: 'distance_high_voltage_lines', label: 'Avstand til strømkabler:', placeholder: 'F.eks. 3', unit: 'meter' },
  { name: 'distance_road', label: 'Avstand til vei:', placeholder: 'F.eks. 5', unit: 'meter' },
];

// Distance measurement inputs
const distanceInputs = [
  { name: 'neighbor_boundary', label: 'Nabogrense:', placeholder: 'F.eks. 4', unit: 'meter' },
  { name: 'road_center', label: 'Midten av vei:', placeholder: 'F.eks. 6', unit: 'meter' },
  { name: 'nearest_building', label: 'Nærmeste bygning på naboeiendom:', placeholder: 'F.eks. 5', unit: 'meter' },
];

// Building density inputs
const buildingDensityInputs = [
  { name: 'allowed_utilization', label: 'Tillatt grad av utnytting:', unit: '', wideLabel: true },
  { name: 'property_net_area', label: 'Tomtens nettoareal:', unit: 'm²', wideLabel: true },
  { name: 'current_area', label: 'Areal av bygninger, konstruksjoner og parkering i dag:', unit: 'm²', wideLabel: true },
  { name: 'future_area', label: 'Areal av bygninger, konstruksjoner og parkering etterpå:', unit: 'm²', wideLabel: true },
  { name: 'utilization_after_project', label: 'Grad av utnytting etter prosjekt:', unit: '', wideLabel: true },
];

// Calculation methods - use the constants from formTypes
const calculationMethodOptions = [
  { label: 'BYA -', value: CALCULATION_METHODS.BYA },
  { label: 'BRA -', value: CALCULATION_METHODS.BRA },
  { label: 'T-BRA -', value: CALCULATION_METHODS.T_BRA },
  { label: '%BYA -', value: CALCULATION_METHODS.BYA_PERCENT },
  { label: '%BRA -', value: CALCULATION_METHODS.BRA_PERCENT },
  { label: '%TU -', value: CALCULATION_METHODS.TU_PERCENT },
  { label: 'U-grad', value: CALCULATION_METHODS.U_GRAD },
];

// Environmental conflicts
const environmentalConflictGroups = [
  [
    { name: 'distance_train_tracks', label: 'Er det mindre enn 30 meter til nærmeste trikke-eller togspor?' },
    { name: 'distance_water_sewer_pipes', label: 'Bygger/river du i nærheten av en vann- og avløpsledning?' },
    { name: 'distance_high_voltage_lines', label: 'Bygger/river du i nærheten av høyspent kraftlinje?' },
  ],
  [
    { name: 'near_beach_or_river', label: 'Bygger/river du i nærheten av strandsonen eller sjø/elv/vassdrag?' }, 
    { name: 'in_flood_risk_area', label: 'Skal du bygge/rive i et flom-, ras- eller skredutsatt område?' },
    { name: 'protected_species_present', label: 'Finnes det truende eller vernede arter på eiendommen er i nærheten?' },
    { name: 'cultural_heritage_site', label: 'Finnes det kulturminner eller verneverdig bebyggelse på eiendommen eller i nærheten?' },
  ]
];

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
  const { saveField, isSaving } = ApplicationService.useSaveFormData(applicationID, 'sma-prosjekter');
  const tooltip = UIComponents.useTooltip();

  const formData = { ...smaProsjekterDefaultValues, ...externalFormData };

  const checkFormValidity = (data: SmaProsjekterFormData) => {
    const basicFieldsValid =
      // Building measurements
      (data.size?.trim() ?? '') !== '' &&
      (data.mønehøyde?.trim() ?? '') !== '' &&
      (data.gesimshøyde?.trim() ?? '') !== '' &&
      (data.distance_road?.trim() ?? '') !== '' &&
      
      // Distance measurements
      (data.road_center?.trim() ?? '') !== '' &&
      (data.neighbor_boundary?.trim() ?? '') !== '' &&
      (data.nearest_building?.trim() ?? '') !== '' &&
      
      // Calculation method
      (data.calculation_method?.length ?? 0) > 0 &&
      
      // Environmental conflicts
      (data.distance_train_tracks === 'Ja' || data.distance_train_tracks === 'Nei') &&
      (data.distance_water_sewer_pipes === 'Ja' || data.distance_water_sewer_pipes === 'Nei') &&
      (data.distance_high_voltage_lines === 'Ja' || data.distance_high_voltage_lines === 'Nei') &&
      (data.in_flood_risk_area === 'Ja' || data.in_flood_risk_area === 'Nei') &&
      (data.near_beach_or_river === 'Ja' || data.near_beach_or_river === 'Nei') && 
      (data.protected_species_present === 'Ja' || data.protected_species_present === 'Nei') &&
      (data.cultural_heritage_site === 'Ja' || data.cultural_heritage_site === 'Nei') &&
      
      // Building density
      (data.allowed_utilization?.trim() ?? '') !== '' &&
      (data.property_net_area?.trim() ?? '') !== '' &&
      (data.current_area?.trim() ?? '') !== '' &&
      (data.future_area?.trim() ?? '') !== '' &&
      (data.utilization_after_project?.trim() ?? '') !== '' &&
      
      // Access
      (data.new_driveway === 'Ja' || data.new_driveway === 'Nei') &&
      
      // Plan compliance
      (data.planCompliance === 'Ja' || data.planCompliance === 'Nei') &&
      (data.planCompliance !== 'Nei' || (data.nonComplianceReason?.trim() ?? '') !== '');

    // Validate road_type only if new driveway is planned
    const drivewayValid = data.new_driveway === 'Nei' || data.road_type !== '';

    const isValid = basicFieldsValid && drivewayValid;
    onValidityChange(isValid);
    return isValid;
  };

  const handleFieldChange = (name: string, value: string | boolean | string[]) => {
    const updatedFormData = {
      ...formData,
      [name]: value,
    };

    externalSetFormData((prev) => ({ ...prev, [name]: value }));
    checkFormValidity(updatedFormData);

    console.log(`Saving field: ${name} with value:`, value);

    // Get the mapped field path for saving to the backend
    const fieldPath = resolveFieldPath(name, 'sma-prosjekter');
    
    // Save using the resolved field path

    try {
      if (Array.isArray(value)) {
        void saveField(fieldPath, JSON.stringify(value)); // Added void to handle promise
      } else {
        void saveField(fieldPath, value.toString()); // Added void to handle promise
      }
    } catch (error) {
      console.error(`Error saving field ${fieldPath}:`, error);
    }
  }; // This brace now correctly closes handleFieldChange

  const tooltipContents = {
    buildingDetails: 'Her kan du fylle ut detaljene om bygningen, som størrelse, materiale og avstand til nabogrensen.',
    calculationMethod: 'Beregningsmetode i en byggesøknad er måten arealer og volumer beregnes på for å sikre at prosjektet overholder gjeldende lover og forskrifter.',
    buildingDensity: 'Utnyttingsgraden er et mål på hvor stor del av en tomt som kan bebygges. Den regnes ut ved å dividere bygningens bruksareal (BRA) med tomtens areal (BYA).',
    shortestDistance: 'Skal du rive, eller er noe så langt unna at det ikke vises på situasjonskartet? Da kan du stryke over punktet.',
    conflictWithSurroundings: 'Her kan du krysse av for endringene du planlegger å gjøre på eiendommen din.',
    driveway: 'Hvis byggeprosjektet vil føre til en ny eller endret avkjørsel til eiendommen, må du søke om tillatelse fra Statens vegvesen eller kommunen.',
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    handleFieldChange(e.target.name, e.target.value);
  };

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFieldChange(e.target.name, e.target.value);
  };

  // Handle calculation method changes
  const handleCalculationMethodChange = (method: string) => {
    // Since calculation_method is already an array in the type definition,
    // we don't need to split it
    const currentMethods = formData.calculation_method || [];
    
    const updatedMethods = currentMethods.includes(method)
      ? currentMethods.filter(v => v !== method)
      : [...currentMethods, method];
    
    // Pass the array directly, no need to join
    handleFieldChange('calculation_method', updatedMethods);
  };

  useEffect(() => {
    checkFormValidity(formData);
  
  }, []); 

  return (
    <div className="justify-center flex flex-col w-full">
      <h1 className="text-3xl font-bold justify-center flex">Detaljer til det du vil gjøre</h1>

      {/* Building Details Section */}
      <div className="border-2 border-gray-400 rounded-lg mt-4 p-4" data-cy="main-container">
        <div className="flex flex-col md:flex-row">
          <div className="w-full md:w-3/6" data-cy="left-column">
            <h2 className="inline-flex font-medium">
              Bygningdetaljer
              <Tooltip
                id="buildingDetails"
                content={tooltipContents.buildingDetails}
                isVisible={tooltip.isVisible('buildingDetails')}
                onMouseEnter={tooltip.handleMouseEnter}
                onMouseLeave={tooltip.handleMouseLeave}
              />
            </h2>

            <form className="mt-4">
              {buildingInputs.map(input => (
                <div key={input.name}>
                  <label className="text-sm font-medium text-gray-700 mb-1 mr-1">{input.label}</label>
                  <input
                    type="number"
                    name={input.name}
                    placeholder={input.placeholder}
                    className="text-sm w-24 h-8 p-2 border-b-2 bg-gray-100 border-gray-400 outline-none mb-2"
                    value={formData[input.name as keyof typeof formData] as string}
                    onChange={handleInputChange}
                    required
                  />
                  <span className="ml-2 text-sm">{input.unit}</span>
                </div>
              ))}

              <h2 className="inline-flex font-medium mt-2">
                Korteste avstand
                <Tooltip
                  id="shortestDistance" 
                  content={tooltipContents.shortestDistance}
                  isVisible={tooltip.isVisible('shortestDistance')}
                  onMouseEnter={tooltip.handleMouseEnter}
                  onMouseLeave={tooltip.handleMouseLeave}
                />
              </h2>

              <p className="italic text-sm mb-2">
                Bruk situasjonskartet og mål opp korteste avstand fra rommet/rommene du skal endre til:
              </p>

              {distanceInputs.map(input => (
                <div key={input.name}>
                  <label className="text-sm font-medium text-gray-700 mb-1 mr-1">{input.label}</label>
                  <input
                    type="number"
                    name={input.name}
                    placeholder={input.placeholder}
                    className="required text-sm w-24 h-8 p-2 border-b-2 bg-gray-100 border-gray-400 outline-none mb-2"
                    value={formData[input.name as keyof typeof formData] as string}
                    onChange={handleInputChange}
                    required
                  />
                  <span className="ml-2 text-sm">{input.unit}</span>
                </div>
              ))}
            </form>
          </div>

          <div className="w-full md:w-3/6 md:border-l-2 md:border-gray-400 md:pl-8" data-cy="right-column">
            <h2 className="font-medium inline-flex">
              Beregningsmåte
              <Tooltip
                id="calculationMethod"
                content={tooltipContents.calculationMethod}
                isVisible={tooltip.isVisible('calculationMethod')}
                onMouseEnter={tooltip.handleMouseEnter}
                onMouseLeave={tooltip.handleMouseLeave}
              />
            </h2>
            <p className="text-sm italic mb-2">
              Hva er beregningsmåten for grad av utnytting for eiendommen din? (Velg minst én){' '}
            </p>
            
            <div className="space-y-2">
              {calculationMethodOptions.map((method) => {
                return (
                  <div key={method.value} className="flex items-start">
                    <input
                      type="checkbox"
                      id={`calc-method-${method.value}`}
                      checked={(formData.calculation_method || []).includes(method.value)}
                      onChange={() => handleCalculationMethodChange(method.value)}
                      className="mt-1 mr-2"
                    />
                    <label htmlFor={`calc-method-${method.value}`} className="flex flex-col">
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

      {/* Building Density Section */}
      <div className="border-2 border-gray-400 rounded-lg mt-4 p-4">
        <h2 className="font-medium inline-flex">
          Utnyttningsgrad
          <Tooltip
            id="buildingDensity"
            content={tooltipContents.buildingDensity}
            isVisible={tooltip.isVisible('buildingDensity')}
            onMouseEnter={tooltip.handleMouseEnter}
            onMouseLeave={tooltip.handleMouseLeave}
          />
        </h2>
        <p className="text-sm mb-1">
          Oppgi arealet til alle bygninger på eiendommen din, og regn ut ny grad av utnytting.
        </p>
        <p className="text-sm font-medium italic mb-4">Bruk den beregningsmåten du krysset av for over.</p>

        <div className="space-y-4">
          {buildingDensityInputs.map(input => (
            <div key={input.name} className="flex items-center">
              <label className="text-sm font-medium text-gray-700 w-[300px]">{input.label}</label>
              <input
                type="text"
                name={input.name}
                className="text-sm w-72 h-8 p-2 border border-gray-400 rounded ml-20"
                value={formData[input.name as keyof typeof formData] as string}
                onChange={handleInputChange}
                required
              />
              {input.unit && <span className="ml-2 text-sm">{input.unit}</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Environmental Conflicts Section */}
      <div className="w-full min-h-28 mt-4 p-4 border-2 border-gray-400 rounded-lg space-y-4">
        <h2 className="font-medium inline-flex">
          Kan byggeplanene dine være i konflikt med omgivelsene?
          <Tooltip
            id="conflictWithSurroundings"
            content={tooltipContents.conflictWithSurroundings}
            isVisible={tooltip.isVisible('conflictWithSurroundings')}
            onMouseEnter={tooltip.handleMouseEnter}
            onMouseLeave={tooltip.handleMouseLeave}
          />
        </h2>
        <p className="text-sm italic">
          Svarer du ja på noen av disse, må du legge ved tillatelse eller uttalelse fra eier.
        </p>

        {environmentalConflictGroups[0]!.map((item) => ( 
          <RadioGroup
            key={item.name}
            name={item.name}
            label={item.label}
            options={yesNoOptions}
            value={formData[item.name as keyof typeof formData] as string}
            onChange={handleRadioChange}
          />
        ))}

        <div className="border border-gray-300" />
        <p className="text-sm italic">
          Svarer du ja på noen av disse, må du legge ved tillatelse eller uttalelse fra eier.
        </p>

        {environmentalConflictGroups[1]!.map((item) => ( // Add non-null assertion operator (!)
          <RadioGroup
            key={item.name}
            name={item.name}
            label={item.label}
            options={yesNoOptions}
            value={formData[item.name as keyof typeof formData] as string}
            onChange={handleRadioChange}
          />
        ))}
      </div>

      {/* Driveway Section */}
      <div className="border-2 border-gray-400 rounded-lg mt-4 p-4">
        <h2 className="font-medium mb-2 inline-flex">
          Vil byggeprosjektet føre til en ny/endret avkjøring til eiendommen?
          <Tooltip
            id="driveway"
            content={tooltipContents.driveway}
            isVisible={tooltip.isVisible('driveway')}
            onMouseEnter={tooltip.handleMouseEnter}
            onMouseLeave={tooltip.handleMouseLeave}
          />
        </h2>

        <div className="gap-4 flex">
          {yesNoOptions.map((option) => (
            <label key={option.value} className="items-center">
              <input
                type="radio"
                name="new_driveway"
                value={option.value}
                checked={formData.new_driveway === option.value}
                onChange={handleRadioChange}
                className="mr-2"
              />
              {option.label}
            </label>
          ))}
        </div>
        
        {formData.new_driveway === 'Ja' && (
          <div className="mt-4 gap-2">
            <h1 className="text-md font-medium text-gray">
              Eiendommen vil få ny/endret avkjørsel til (sett kryss):
            </h1>
            <div className="ml-8 mt-2 flex flex-col gap-2">
              {[
                { value: ROAD_TYPES.RIKSVEI, label: 'Riksvei eller fylkesvei' },
                { value: ROAD_TYPES.KOMMUNAL, label: 'Kommunal vei' },
                { value: ROAD_TYPES.PRIVAT, label: 'Privat vei' },
              ].map((option) => (
                <label key={option.value} className="items-center gap-x-2 flex">
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
              Du vil få muligheten til å legge til vedlegg som viser at du har avkjøringstillatelse fra Statens vegvesen
              eller kommunen, eller/og veirett gjennom tinglyst erklæring i senere steg.
            </p>
          </div>
        )}
      </div>

      {/* Plan Compliance Section */}
      <div className="border-2 border-gray-400 rounded-lg mt-4 p-4">
        <h2 className="font-medium mb-2">
          Er tiltaket i samsvar med gjeldende plan?
        </h2>

        <div className="gap-4 flex">
          {yesNoOptions.map((option) => (
            <label key={option.value} className="items-center">
              <input
                type="radio"
                name="planCompliance"
                value={option.value}
                checked={formData.planCompliance === option.value}
                onChange={handleRadioChange}
                className="mr-2"
              />
              {option.label}
            </label>
          ))}
        </div>
        
        {formData.planCompliance === 'Nei' && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Begrunn hvorfor tiltaket ikke er i samsvar med gjeldende plan:
            </label>
            <textarea
              name="nonComplianceReason"
              rows={3}
              className="w-full border border-gray-300 rounded-md p-2"
              value={formData.nonComplianceReason}
              onChange={handleInputChange}
            />
          </div>
        )}
      </div>

      {isSaving && (
        <div className="fixed bottom-4 right-4 bg-white shadow-md rounded-full p-2 z-10">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
};

export default Step1_1;