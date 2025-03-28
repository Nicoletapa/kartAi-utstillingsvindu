"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, AlertCircle } from "lucide-react";
import { ProgressBar } from "./Progressbar";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import SjekklisteSoknad from "./SjekklisteSoknad";
import Step_applicant_details from "./steps/Step_applicant_details";
import Step1_0 from "./steps/Step1_0";
import Step2_0 from "./steps/Step2_0";
import Step2_1 from "./steps/Step2_1";
import Step2_2 from "./steps/Step2_2";
import Step3_0 from "./steps/Step3_0";
import Step3_1 from "./steps/Step3_1";
import Step3_2 from "./steps/Step3_2";
import Step4_0 from "./steps/Step4_0";
import Step5_0 from "./steps/Step5_0";
import Step6_0 from "./steps/Step6_0";
import Step6_1 from "./steps/Step6_1";
import Step6_2 from "./steps/Step6_2";
import { api } from "~/trpc/react";
import { toast } from "react-hot-toast";
import { ApplicationType } from "@prisma/client";

interface StepComponentType {
    onValidityChange: (isValid: boolean) => void;
    applicationID?: number;
}

type StepComponentsType = {
    [key: number]: {
        [key: number]: React.ComponentType<StepComponentType>;
    };
};

const stepComponents: StepComponentsType = {
    0: {
        0: Step_applicant_details,
    },
    1: {
        0: Step1_0,
    },
    2: {
        0: Step2_0,
        1: Step2_1,
        2: Step2_2,
    },
    3: {
        0: Step3_0,
        1: Step3_1,
        2: Step3_2,
    },
    4: {
        0: Step4_0,
    },
    5: {
        0: Step5_0,
    },
    6: {
        0: Step6_0,
        1: Step6_1,
        2: Step6_2,
    },
};

export const steps = [
    { title: "Søker og eiendom", totalSubsteps: Object.keys(stepComponents[0] || {}).length },
    { title: "Oversikt", totalSubsteps: Object.keys(stepComponents[1] || {}).length },
    { title: "Dokumentsjekk", totalSubsteps: Object.keys(stepComponents[2] || {}).length },
    { title: "Nabovarsel", totalSubsteps: Object.keys(stepComponents[3] || {}).length },
    { title: "Søknaden", totalSubsteps: Object.keys(stepComponents[4] || {}).length },
    { title: "Status", totalSubsteps: Object.keys(stepComponents[5] || {}).length },
    { title: "Veien videre", totalSubsteps: Object.keys(stepComponents[6] || {}).length },
];
interface ProgressBarStepProps {
    applicationID?: number;
}

export default function ProgressBarStep({ applicationID }: ProgressBarStepProps) {
    const router = useRouter();
    const [currentOverallStep, setCurrentOverallStep] = useState(0);
    const [lastStepCompleted, setLastStepCompleted] = useState(false);

    // Add state variables for each step's validity
    const [isStep0_0Valid, setIsStep0_0Valid] = useState(false); // For Step_applicant_details
    const [isStep1_0Valid, setIsStep1_0Valid] = useState(false); // For Step1_0

    const [appType, setAppType] = useState<ApplicationType>("sma_byggeprosjekter");

    // Fetch application data
    const { data: application, isLoading: isLoadingApplication, refetch: refetchApplication } = api.application.getApplication.useQuery(
        { applicationID: applicationID ?? 0 },
        { enabled: !!applicationID }
    );

    // Submit application mutation
    const submitApplication = api.application.submitApplication.useMutation({
        onSuccess: () => {
            toast.success("Application submitted successfully");
            router.push("/atlas-app");
        },
        onError: (error) => {
            toast.error(`Error submitting application: ${error.message}`);
        }
    });

    // Load data from application if it exists
    useEffect(() => {
        if (!application) return;

        // Update application type
        setAppType(application.applicationType);

        // Create a map of field names to values
        const fieldsMap: Record<string, string> = {};

        // Check if application_fields exists before using forEach
        if (Array.isArray(application.application_fields)) {
            application.application_fields.forEach(field => {
                fieldsMap[field.fieldName] = field.fieldValue;
            });
        } else {
            console.warn("application_fields is missing or not an array:", application);
        }

        // Check validity of Step1_0 form data using optional chaining
        const isStep1Valid =
            fieldsMap['description']?.trim() !== '' &&
            fieldsMap['area_purpose']?.trim() !== '' &&
            fieldsMap['distances.neighbor_boundary']?.trim() !== '' &&
            fieldsMap['distances.mønehøyde']?.trim() !== '' &&
            fieldsMap['distances.gesimshøyde']?.trim() !== '';

        setIsStep1_0Valid(isStep1Valid);

        // Check validity of Step_applicant_details form data
        const isStep0Valid =
            !!fieldsMap['applicant.name']?.trim() &&
            !!fieldsMap['applicant.email']?.trim() &&
            !!fieldsMap['property.address']?.trim() &&
            !!fieldsMap['property.property_number']?.trim() &&
            !!fieldsMap['property.usage_number']?.trim();

        setIsStep0_0Valid(isStep0Valid);
    }, [application]);

    // Handle next button click
    const handleNext = async () => {
        // We should always have an applicationID now
        if (!applicationID) {
            console.error("No applicationID found, this shouldn't happen");
            return;
        }

        // Handle submission
        if (currentStep === 4 && currentSubstep === 0) {
            const confirmSend = window.confirm("Er du sikker på at du vil sende inn søknaden?");
            if (!confirmSend) return;

            try {
                await submitApplication.mutateAsync({ applicationID });
            } catch (error) {
                console.error("Error submitting application:", error);
            }
            return;
        }

        // Move to next step
        if (currentOverallStep < totalSubsteps - 1) {
            setCurrentOverallStep(currentOverallStep + 1);
        } else if (!lastStepCompleted) {
            setLastStepCompleted(true);
        }
    };

    // Rest of your component remains the same
    const totalSubsteps = steps.reduce((acc, step) => acc + step.totalSubsteps, 0);

    const getCurrentStepInfo = (step = currentOverallStep) => {
        let stepIndex = 0;
        let substepCount = 0;

        while (stepIndex < steps.length) {
            const currentStep = steps[stepIndex];

            if (currentStep && step < substepCount + currentStep.totalSubsteps) {
                return {
                    currentStep: stepIndex + 1,
                    currentSubstep: step - substepCount,
                };
            }

            if (currentStep) {
                substepCount += currentStep.totalSubsteps;
            }
            stepIndex++;
        }

        return { currentStep: 1, currentSubstep: 0 };
    };

    const { currentStep, currentSubstep } = getCurrentStepInfo(currentOverallStep);

    useEffect(() => {
        // Force reload application data when navigating to Step_applicant_details
        if (currentStep === 1 && currentSubstep === 0) {
            console.log("Navigated to Step_applicant_details, forcing reload");

            // Fetch application data again
            // This will trigger the application data loading effect in Step_applicant_details
            void refetchApplication();
        }
    }, [currentStep, currentSubstep]);

    const handlePrev = () => {
        if (currentOverallStep === 0) {
            const confirmExit = window.confirm("Er du sikker på at du vil forlate siden?");
            if (confirmExit) {
                router.push("/atlas-app");
            }
        } else {
            setCurrentOverallStep(currentOverallStep - 1);
        }
    };

    const stepsWithStatus = steps.map((step, index) => {
        const stepStart = steps.slice(0, index).reduce((acc, s) => acc + s.totalSubsteps, 0);
        const stepEnd = stepStart + step.totalSubsteps;

        const substepsCompleted = Math.min(step.totalSubsteps, Math.max(0, currentOverallStep - stepStart));

        return {
            ...step,
            isCompleted: currentOverallStep >= stepEnd,
            isActive: currentOverallStep >= stepStart && currentOverallStep < stepEnd,
            substepsCompleted,
            isLastStep: index === steps.length - 1,
            stepNumber: index + 1,
            isFirstStep: index === 0,
        };
    });

    const isAtSubmissionStep = currentStep === 4 && currentSubstep === 0;

    const CurrentStepComponent = stepComponents[currentStep - 1]?.[currentSubstep] || null;

    // Update to check all step validations
    const isNextButtonDisabled =
        (currentStep === 1 && currentSubstep === 0 && !isStep0_0Valid) || // Check Step_applicant_details
        (currentStep === 2 && currentSubstep === 0 && !isStep1_0Valid) || // Check Step1_0
        submitApplication.isPending;

    // Function to get the correct validator function for the current step
    const getValidatorForCurrentStep = () => {
        if (currentStep === 1 && currentSubstep === 0) return setIsStep0_0Valid;
        if (currentStep === 2 && currentSubstep === 0) return setIsStep1_0Valid;

        // Default validator function - allows progression if no specific validation is required
        return () => true;
    };

    return (
        <div className="container mx-auto py-6 px-4 flex flex-col">
            <div className="mb-8 top-0 bg-background pt-4 pb-8 z-10">
                <ProgressBar steps={stepsWithStatus} />
            </div>

            <div className="flex space-x-8 flex-1">
                <SjekklisteSoknad currentStep={currentStep} currentSubstep={currentSubstep} />
                {isLoadingApplication ? (
                    <div className="w-full flex justify-center items-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : CurrentStepComponent && (
                    <CurrentStepComponent
                        onValidityChange={getValidatorForCurrentStep()}
                        applicationID={applicationID}
                    />
                )}
            </div>

            <div className="flex justify-between mt-8 gap-4">
                <Button
                    onClick={handlePrev}
                    className="border-2 bg-white text-gray-500 border-gray-500 hover:bg-gray-500 hover:text-white w-44"
                    disabled={submitApplication.isPending}
                >
                    <ArrowLeft size={18} className="mr-2" />
                    Tilbake
                </Button>
                <div className="flex items-center">
                    {isNextButtonDisabled && (
                        <div className="flex items-center mr-4 text-red-500 text-sm">
                            <AlertCircle size={16} className="mr-2 flex-shrink-0" />
                            <span>
                                {submitApplication.isPending
                                    ? 'Vennligst vent...'
                                    : 'Alle påkrevde felt må fylles ut før du kan gå videre'}
                            </span>
                        </div>
                    )}
                    <Button
                        onClick={handleNext}
                        className="border-2 bg-white text-kartAI-blue border-kartAI-blue hover:text-white hover:bg-kartAI-blue w-44"
                    >
                        {submitApplication.isPending ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current mr-2"></div>
                        ) : null}
                        {isAtSubmissionStep ? "Send inn søknaden" : "Neste"}
                        <ArrowRight size={18} className="ml-2" />
                    </Button>
                </div>
            </div>
        </div>
    );
}