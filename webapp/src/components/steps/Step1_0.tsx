import React, { useState, useEffect, useCallback } from 'react';
import { Info } from 'lucide-react';
import {type DistancesDetails, getDefaultDistancesSmaProsjekter } from '~/utils/applicationForm';
import { api } from "~/trpc/react";
import { toast } from "react-hot-toast";

interface Step1_0Props {
  applicationID?: number;
  onValidityChange: (isValid: boolean) => void;
}


const Step1_0: React.FC<Step1_0Props> = ({ applicationID, onValidityChange }) => {
  // Local state for this step's form data
  const [formData, setFormData] = useState({
    description: '',
    area_purpose: '',
    distances: getDefaultDistancesSmaProsjekter()
  });
  
  const [hoveredBox, setHoveredBox] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  
  // Setup TRPC mutations
  const updateApplication = api.application.updateApplication.useMutation();
  const addApplicationField = api.application.addApplicationField.useMutation();

  // Fetch application data
  const { data: application, isLoading: isLoadingApplication } = api.application.getApplication.useQuery(
    { applicationID: applicationID ?? 0 },
    { enabled: !!applicationID }
  );
  
  // Load data from application
  useEffect(() => {
    if (!application?.application_fields?.length) return;
    
    // Create a map of field names to values
    const fieldsMap: Record<string, string> = {};
    application.application_fields.forEach(field => {
        fieldsMap[field.fieldName] = field.fieldValue;
    });
    
    // Update form data based on loaded fields
    const updatedFormData = {
        description: fieldsMap['description'] || '',
        area_purpose: fieldsMap['area_purpose'] || '',
        distances: {
            neighbor_boundary: fieldsMap['distances.neighbor_boundary'] || '',
            road_center: fieldsMap['distances.road_center'] || '',
            nearest_building: fieldsMap['distances.nearest_building'] || '',
            distance_train_tracks: fieldsMap['distances.distance_train_tracks'] || '',
            distance_water_sewer_pipes: fieldsMap['distances.distance_water_sewer_pipes'] || '',
            distance_high_voltage_lines: fieldsMap['distances.distance_high_voltage_lines'] || '',
            distance_va: fieldsMap['distances.distance_va'] || '',
            mønehøyde: fieldsMap['distances.mønehøyde'] || '',
            gesimshøyde: fieldsMap['distances.gesimshøyde'] || '',
            in_flood_risk_area: fieldsMap['distances.in_flood_risk_area'] || 'No',
            protected_species_present: fieldsMap['distances.protected_species_present'] || 'No',
            cultural_heritage_site: fieldsMap['distances.cultural_heritage_site'] || 'No'
        }
    };
    
    setFormData(updatedFormData);
    checkFormValidity(updatedFormData);
  }, [application]);

  // Simplified tooltip handling
  const handleTooltip = (box: string | null) => setHoveredBox(box);

  // Memoize form validity check function
  const checkFormValidity = useCallback((data = formData) => {
    const { description, area_purpose, distances } = data;
    
    const isValid =
      description?.trim() !== '' &&
      area_purpose?.trim() !== '' &&
      distances?.neighbor_boundary?.trim() !== '' &&
      distances?.mønehøyde?.trim() !== '' &&
      distances?.gesimshøyde?.trim() !== '';
      
    onValidityChange(isValid);
    return isValid;
  }, [formData, onValidityChange]);

  // Input change handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Create updated form data
    const updatedData = name.startsWith('distances.')
      ? {
          ...formData,
          distances: {
            ...formData.distances,
            [name.split('.')[1] as keyof DistancesDetails]: value
          }
        }
      : { ...formData, [name]: value };
    
    // Update UI immediately
    setFormData(updatedData);
    
    // Check validity with updated data
    checkFormValidity(updatedData);
    
    // Mark as dirty (which triggers save)
    setIsDirty(true);
  };

  // Auto-save changes
  useEffect(() => {
    if (!isDirty || !applicationID) return;
    
    setSaveStatus('saving');
    
    const saveTimeout = setTimeout(() => {
      saveChangesToDatabase()
        .then(() => {
          setSaveStatus('saved');
          
          // Show toast only occasionally (20% of saves)
          if (Math.random() < 0.2) {
            toast.success("Endringer lagret", {
              duration: 2000,
              position: "bottom-right",
              id: "save-toast", 
            });
          }
        })
        .catch((error) => {
          setSaveStatus('error');
          toast.error(`Feil ved lagring: ${error.message}`);
        });
    }, 800); // Reduced from 1000ms
    
    return () => clearTimeout(saveTimeout);
  }, [formData, isDirty, applicationID]);
  
  // Save changes to database - optimized with parallel saving
  const saveChangesToDatabase = async () => {
    if (!applicationID) return false;
    
    try {
      // Update the application's updatedDate
      await updateApplication.mutateAsync({
        applicationID, 
        updatedDate: new Date(),
      });

      // Create an array of promises for parallel execution
      const savePromises = [
        // Main fields
        addApplicationField.mutateAsync({
          applicationID, 
          fieldName: 'description',
          fieldValue: formData.description || '',
        }),
        addApplicationField.mutateAsync({
          applicationID, 
          fieldName: 'area_purpose',
          fieldValue: formData.area_purpose || '',
        })
      ];
      
      // Add distance field save promises
      Object.entries(formData.distances || {}).forEach(([key, value]) => {
        savePromises.push(
          addApplicationField.mutateAsync({
            applicationID, 
            fieldName: `distances.${key}`,
            fieldValue: value || '',
          })
        );
      });
      
      // Execute all saves in parallel
      await Promise.all(savePromises);
      
      setIsDirty(false);
      return true;
    } catch (error) {
      console.error('Error saving form data:', error);
      throw error;
    }
  };

  // Show loading if fetching application data
  if (isLoadingApplication && applicationID) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3">Laster data...</span>
      </div>
    );
  }

  return (
    <div className="md:px-10">
      <h1 className="text-3xl font-bold justify-center flex">Hva vil du gjøre på eiendommen din?</h1>

      <h2 className="font-medium mt-4 inline-flex">
        Beskrivelse av tiltaket
        <div className="relative flex">
          <Info
            size={14}
            className="ml-1 hover:cursor-pointer"
            onMouseEnter={() => handleTooltip('beskrivelse')}
            onMouseLeave={() => handleTooltip(null)}
          />
          {hoveredBox === 'beskrivelse' && (
            <div
              className="absolute top-0 left-6 bg-white shadow-lg border rounded-lg p-3 w-64 text-sm z-10"
              onMouseEnter={() => handleTooltip('beskrivelse')}
              onMouseLeave={() => handleTooltip(null)}
            >
              Her kan du gi en detaljert beskrivelse av tiltaket du planlegger å gjennomføre.
            </div>
          )}
        </div>
      </h2>

      <textarea
        name="description"
        className="w-full min-h-28 mt-2 p-4 text-md border-2 border-gray-400 rounded-lg"
        placeholder="Skriv her ..."
        value={formData.description}
        onChange={handleInputChange}
        required
      />

      <div className="border-2 border-gray-400 rounded-lg mt-4 p-4" data-cy="main-container">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-3/6" data-cy="left-column">
            <h2 className="inline-flex font-medium">
              Bygningdetaljer
              <div className="relative flex">
                <Info
                  size={14}
                  className="ml-1 hover:cursor-pointer"
                  onMouseEnter={() => handleTooltip('bygningsdetaljer')}
                  onMouseLeave={() => handleTooltip(null)}
                />
                {hoveredBox === 'bygningsdetaljer' && (
                  <div
                    className="absolute top-0 left-6 bg-white shadow-lg border rounded-lg p-3 w-64 text-sm"
                    onMouseEnter={() => handleTooltip('bygningsdetaljer')}
                    onMouseLeave={() => handleTooltip(null)}
                  >
                    Her kan du fylle ut detaljene om bygningen, som størrelse, materiale og avstand til nabogrensen.
                  </div>
                )}
              </div>
            </h2>

            <form className="space-y-4 mt-4">
             

    
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 mr-1">Mønehøyde:</label>
                <input
                  type="number"
                  name="distances.mønehøyde"
                  className="text-sm w-20 h-8 p-2 border-b-2 border-gray-400 outline-none"
                  value={formData.distances.mønehøyde || ''}
                  onChange={handleInputChange}
                  required
                />
                <span className="ml-2 text-sm">meter</span>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 mr-1">Gesimshøyde:</label>
                <input
                  type="number"
                  name="distances.gesimshøyde"
                  className="text-sm w-20 h-8 p-2 border-b-2 border-gray-400 outline-none"
                  value={formData.distances.gesimshøyde || ''}
                  onChange={handleInputChange}
                  required
                />
                <span className="ml-2 text-sm">meter</span>
              </div>

              <div>
                <label className="text-sm  font-medium text-gray-700 mb-1 mr-1">Avstand til nabogrense:</label>
                <input
                  type="number"
                  name="distances.neighbor_boundary"
                  className="text-sm w-20 h-8 p-2 border-b-2 border-gray-400 outline-none"
                  value={formData.distances.neighbor_boundary || ''}
                  onChange={handleInputChange}
                  required
                />
                <span className="ml-2 text-sm">meter</span>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700  mb-1">Avstand til jernbane/trikk:</label>
                <input
                  type="text"
                  name="distances.distance_train_tracks"
                  className="text-sm w-20 h-8 p-2 border-b-2 border-gray-400 outline-none"
                  value={formData.distances.distance_train_tracks || ''}
                  onChange={handleInputChange}
                />
                <span className="ml-2 text-sm">meter</span>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700  mb-1">Avstand til vann/avløpsrør:</label>
                <input
                  type="text"
                  name="distances.distance_water_sewer_pipes"
                  className="text-sm w-20 h-8 p-2 border-b-2 border-gray-400 outline-none"
                  value={formData.distances.distance_water_sewer_pipes || ''}
                  onChange={handleInputChange}
                />
                <span className="ml-2 text-sm">meter</span>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700  mb-1">Avstand til høyspentledninger:</label>
                <input
                  type="text"
                  name="distances.distance_high_voltage_lines"
                  className="text-sm w-20 h-8 p-2 border-b-2 border-gray-400 outline-none"
                  value={formData.distances.distance_high_voltage_lines || ''}
                  onChange={handleInputChange}
                />
                <span className="ml-2 text-sm">meter</span>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700  mb-1">Avstand til VA:</label>
                <input
                  type="text"
                  name="distances.distance_va"
                  className="text-sm w-20 h-8 p-2 border-b-2 border-gray-400 outline-none"
                  value={formData.distances.distance_va || ''}
                  onChange={handleInputChange}
                />
                <span className="ml-2 text-sm">meter</span>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700  mb-1">I flomutsatt område?</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="distances.in_flood_risk_area"
                      value="Yes"
                      checked={formData.distances.in_flood_risk_area === "Yes"}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    Ja
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="distances.in_flood_risk_area"
                      value="No"
                      checked={formData.distances.in_flood_risk_area === "No"}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    Nei
                  </label>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700  mb-1">Verneverdige arter tilstede?</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="distances.protected_species_present"
                      value="Yes"
                      checked={formData.distances.protected_species_present === "Yes"}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    Ja
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="distances.protected_species_present"
                      value="No"
                      checked={formData.distances.protected_species_present === "No"}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    Nei
                  </label>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700  mb-1">Kulturminneområde?</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="distances.cultural_heritage_site"
                      value="Yes"
                      checked={formData.distances.cultural_heritage_site === "Yes"}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    Ja
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="distances.cultural_heritage_site"
                      value="No"
                      checked={formData.distances.cultural_heritage_site === "No"}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    Nei
                  </label>
                </div>
              </div>
       
            </form>
          </div>

          <div className="w-full md:w-4/6 md:border-l-2 md:border-gray-400 md:pl-8" data-cy="right-column">
            <h3 className="font-medium mb-4">Ytterligere informasjon</h3>
            
            
            <div className="mt-6">
              <p>
                Tiltaket er i samsvar med gjeldene regularingsplan og vil/vil ikke medføre vesentlige endringer for
                nabolaget. Det vil påvirke eksisterende bebyggelse og miljø ved
              </p>
              <input
                type="text"
                name="area_purpose"
                className="text-sm w-full h-8 p-2 mb-1 border-b-2 border-gray-400 outline-none"
                placeholder="F.eks å gi bedre parkeringsmuligheter uten å forstyrre omkringliggende strukturer"
                value={formData.area_purpose}
                onChange={handleInputChange}
                required
              />
              <span>(Begrunnelse)</span>
            </div>
          </div>
        </div>
      </div>
      {saveStatus === 'saving' && (
        <div className="fixed bottom-4 right-4 bg-white shadow-md rounded-full p-1 z-10">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
};

export default Step1_0;