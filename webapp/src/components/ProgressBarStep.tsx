/**
 * This file is used in Utstillingsvindu 2.0
 * 
 * @description
 * This component handles the logic and rendering of the progress bar and 
 * steps in the building application process.
 * It includes the steps for the application process, such as "Oversikt", 
 * "Dokumentsjekk", "Nabovarsel", "Søknaden", "Status", and "Veien videre".
 * It also displays confirmation messages on certain steps and the "Tilbake" and "Neste" button logic.
 * 
 * @features
 * - Displays the current step and substep in the application process.
 * - Handles the logic for navigating between steps.
 * - Displays a progress bar indicating the current step.
 * - Handles the submission of the application.
 * - Displays a checklist for the application.
 * - Handles the rendering of different step components based on the current step and substep.
 * - Validates the form data and updates the state accordingly.
 * 
 * @props
 * - `applicationID` (number): The ID of the application being processed.
 * - `currentStep` (number): The current step in the application process.
 * 
 * @note
 * - This component is designed to be used in a client-side context.
 * 
 * @usage
 * <ProgressBarStep applicationID={applicationID} currentStep={0}
 */

"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ProgressBar } from "./Progressbar";
import { Button } from "./ui/button";
import { useRouter, usePathname } from "next/navigation";
import type { ApplicationType } from "@prisma/client";
import SjekklisteSoknad from "./SjekklisteSoknad";

import {
    Step1_0, Step1_1
} from "./steps"
import {ProcessStep2_0,ProcessStep2_1,ProcessStep2_2, ProcessStep3_0,  ProcessStep3_1,ProcessStep3_2 ,ProcessStep4_0,ProcessStep4_1, ProcessStep5_0,ProcessStep5_1,ProcessStep6_0 } from "./duplicateSteps"

import {
  BruksendreStep1_0, BruksendreStep1_1
} from "./bruksendreSteps";

import { api } from "~/trpc/react";
import { toast } from "react-hot-toast";

interface CommonStepProps<TFormData = Record<string, unknown>> {
    applicationID: number;
    formData?: TFormData;
    setFormData?: React.Dispatch<React.SetStateAction<TFormData>>;
    onValidityChange?: (isValid: boolean) => void;
}

type StepComponentsType = Record<
    number,
    Record<number, React.ComponentType<CommonStepProps>>
>;

export interface ProgressBarStepProps {
    applicationID: number;
    currentStep?: number;
}

export default function ProgressBarStep({
    applicationID,
    currentStep: externalCurrentStep
}: ProgressBarStepProps) {
    const router = useRouter();
    const pathname = usePathname();

    const isByggeorRive = pathname.includes('/bygge-eller-rive');
    const isBruksendre = pathname.includes('/bruksendring');

    const [currentOverallStep, setCurrentOverallStep] = useState(externalCurrentStep ?? 0);
    const [lastStepCompleted, setLastStepCompleted] = useState(false);
    const [isStep1_0Valid, setIsStep1_0Valid] = useState(false);
    const [appType, setAppType] = useState<ApplicationType>("sma_byggeprosjekter");
    const [formData, setFormData] = useState<Record<string, unknown>>({});

    const stepComponents: StepComponentsType = {
        1: isByggeorRive ? {
            0: Step1_0,
            1: Step1_1,
        } : {
            0: BruksendreStep1_0,
            1: BruksendreStep1_1,
        },
        2: { 0: ProcessStep2_0, 1: ProcessStep2_1, 2: ProcessStep2_2 }, 
        3: { 0: ProcessStep3_0, 1: ProcessStep3_1, 2: ProcessStep3_2 },
        4: { 0: ProcessStep4_0, 1: ProcessStep4_1 },
        5: { 0: ProcessStep5_0, 1: ProcessStep5_1 },
        6: { 0: ProcessStep6_0 }
    } as unknown as StepComponentsType;

    const steps = [
        { title: "Oversikt", totalSubsteps: Object.keys(stepComponents[1] ?? {}).length },
        { title: "Dokumentsjekk", totalSubsteps: Object.keys(stepComponents[2] ?? {}).length },
        { title: "Nabovarsel", totalSubsteps: Object.keys(stepComponents[3] ?? {}).length },
        { title: "Søknaden", totalSubsteps: Object.keys(stepComponents[4] ?? {}).length },
        { title: "Status", totalSubsteps: Object.keys(stepComponents[5] ?? {}).length },
        { title: "Veien videre", totalSubsteps: Object.keys(stepComponents[6] ?? {}).length },
    ];

    const { data: application, refetch: refetchApplication } = api.application.getApplication.useQuery(
        { applicationID: applicationID ?? 0 },
        { enabled: !!applicationID }
    );

    const submitApplication = api.application.submitApplication.useMutation({
        onSuccess: () => {
            toast.success("Application submitted successfully");
        },
        onError: (error) => {
            toast.error(`Error submitting application: ${error.message}`);
        }
    });

    useEffect(() => {
        if (!applicationID || isNaN(applicationID)) {
            console.error("Invalid applicationID:", applicationID);
            toast.error("Ugyldig søknads-ID");
            router.push("/atlas-app");
            return;
        }
        
        if (!isByggeorRive && !isBruksendre) {
            router.push(`/404/${applicationID}`);
            return;
        }
    }, [applicationID, isByggeorRive, isBruksendre, router]);

    useEffect(() => {
        if (!application) return;

        setAppType(application.applicationType);

        const fieldsMap: Record<string, string> = {};

        if (Array.isArray(application.application_fields)) {
            application.application_fields.forEach(field => {
                fieldsMap[field.fieldName] = field.fieldValue;
            });
        } else {
            console.warn("application_fields is missing or not an array:", application);
        }

        const isStep1Valid =
            fieldsMap.description?.trim() !== '' &&
            fieldsMap.area_purpose?.trim() !== '' &&
            fieldsMap['distances.neighbor_boundary']?.trim() !== '' &&
            fieldsMap['distances.mønehøyde']?.trim() !== '' &&
            fieldsMap['distances.gesimshøyde']?.trim() !== '';
        setIsStep1_0Valid(isStep1Valid);
    }, [application]);

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
        if (currentStep === 0 && currentSubstep === 0 && applicationID) {
            const previousStep = localStorage.getItem('previousStep');
            if (previousStep && previousStep !== '0-0') {
                void refetchApplication();
            }
            localStorage.setItem('previousStep', `${currentStep}-${currentSubstep}`);
        }
    }, [currentStep, currentSubstep, applicationID, refetchApplication]);

    const handleNext = async () => {
        if (!applicationID) {
            console.error("No applicationID found, this shouldn't happen");
            return;
        }

        if (currentStep === 4 && currentSubstep === 1) {
            const confirmSend = window.confirm("Er du sikker på at du vil sende inn søknaden?");
            if (!confirmSend) return;

            try {
                await submitApplication.mutateAsync({ applicationID });
                if (currentOverallStep < totalSubsteps - 1) {
                    setCurrentOverallStep(currentOverallStep + 1);
                }
            } catch (error) {
                console.error("Error submitting application:", error);
            }
            return;
        }

        if (currentOverallStep < totalSubsteps - 1) {
            setCurrentOverallStep(currentOverallStep + 1);
        } else if (!lastStepCompleted) {
            setLastStepCompleted(true);
        }

        if (currentStep === 6 && currentSubstep === 0) {
            router.push(`/atlas-app`)
        }
    };

    const totalSubsteps = steps.reduce((acc, step) => acc + step.totalSubsteps, 0);

    const handlePrev = () => {
        if (currentOverallStep === 0) {
            const confirmExit = window.confirm("Er du sikker på at du vil forlate siden?");
            if (confirmExit) {
                router.push(`/atlas-app/i-soknad/${applicationID}/hva-vil-du-gjore`);
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

    const isAtSubmissionStep = currentStep === 4 && currentSubstep === 1;
    const isAtLastStep = currentStep === 6 && currentSubstep === 0; 
    const CurrentStepComponent = stepComponents[currentStep]?.[currentSubstep];

    const handleBackToMain= () => {
        const confirmExit = window.confirm("Er du sikker på at du vil forlate siden?");
        if (confirmExit) {
            router.push(`/atlas-app`);
        }
    };
    const handleValidityChange = (isValid: boolean) => {
        if (currentStep === 1 && currentSubstep === 0) {
            setIsStep1_0Valid(isValid);
        }
    };

    const renderChecklist = () => {
        if (!isByggeorRive && !isBruksendre) return null;

        const titleForCurrentStep = steps[currentStep-1]?.title ?? "Ukjent Steg";
        
        return (
            <div>
                <SjekklisteSoknad 
                currentStep={currentStep} 
                currentSubstep={currentSubstep}
                applicationID={applicationID} 
                currentStepTitle={titleForCurrentStep}
                />
            </div>
        );
    };

    const getAbsoluteStepIndex = (stepIndex: number, substepIndex?: number) => {
        let absoluteIndex = 0;
        for (let i = 0; i < stepIndex; i++) {
            absoluteIndex += steps[i]?.totalSubsteps ?? 0;
        }

        if (substepIndex !== undefined) {
            absoluteIndex += substepIndex;
        }

        return absoluteIndex;
    }

    return (
        <div>
            <div className="mx-20 mt-6">
               <Button className="bg-kartAI-blue hover:bg-kartAI-lightblue w-44" onClick={handleBackToMain}>
                    Tilbake til hovedsiden
               </Button>
            </div>
            
            <div className="container px-4 flex mx-20 flex-col">
            <div className="mb-8 top-0 ml-20 bg-background pt-4 pb-8 z-10">
                <ProgressBar 
                steps={stepsWithStatus}
                onStepClick={(stepIndex, substepIndex) => {
                    const absoluteIndex = getAbsoluteStepIndex(stepIndex, substepIndex);
                    setCurrentOverallStep(absoluteIndex);
                }}
                />
            </div>

            <div className="flex space-x-8 flex-1">
                {currentStep <= 5 && renderChecklist()}
                {CurrentStepComponent && (
                    <CurrentStepComponent
                        applicationID={applicationID}
                        formData={formData}
                        setFormData={setFormData}
                        onValidityChange={handleValidityChange}
                    />
                )}
            </div>

            <div className="flex justify-between mx-20 gap-4 mt-8 mb-8">
                <Button
                    onClick={handlePrev}
                    className="border-2 bg-white text-gray-500 border-gray-500 hover:bg-gray-500 hover:text-white w-44"
                    disabled={submitApplication.isPending}
                >
                    <ArrowLeft size={18} className="mr-2" />
                    Tilbake
                </Button>
                <div className="flex items-center">
                    <Button
                        onClick={handleNext}
                        className="border-2 bg-white text-kartAI-blue border-kartAI-blue hover:text-white hover:bg-kartAI-blue w-44"
                    >
                        {submitApplication.isPending && (
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current mr-2"></div>
                        )}
                        {isAtLastStep
                            ? "Til hovedsiden"
                            : isAtSubmissionStep && !isAtLastStep
                            ? "Send inn søknaden"
                            : "Neste"}
                        <ArrowRight size={18} className="ml-2" />
                    </Button>

                </div>
            </div>
        </div>
        </div>
    );
}