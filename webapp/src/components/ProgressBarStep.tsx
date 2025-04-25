"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, AlertCircle, Check } from "lucide-react";
import { ProgressBar } from "./Progressbar";
import { Button } from "./ui/button";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "~/lib/utils";

import {
    Step1_0, Step1_1, Step2_0, Step2_1, Step2_2,
    Step3_0, Step3_1, Step3_2, Step4_0, Step4_1,
    Step5_0, Step5_1, Step6_0, Step6_1, Step6_2,
} from "./steps"

import {
  BruksendreStep1_0, BruksendreStep1_1, BruksendreStep2_0, BruksendreStep2_1, BruksendreStep2_2,
  BruksendreStep3_0, BruksendreStep3_1, BruksendreStep3_2, BruksendreStep4_0, 
  BruksendreStep4_1, BruksendreStep5_0, BruksendreStep5_1,
  BruksendreStep6_0, BruksendreStep6_1, BruksendreStep6_2,
} from "./bruksendreSteps";

import { api } from "~/trpc/react";
import { toast } from "react-hot-toast";
import { ApplicationType } from "@prisma/client";
import SmallChatbot from "./SmallChatbot";

interface StepComponentType {
    onValidityChange?: (isValid: boolean) => void;
    applicationID?: number;
}
type StepComponentsType = {
    [key: number]: {
        [key: number]: React.ComponentType<any>;
    };
};

export interface ProgressBarStepProps {
    applicationID?: number;
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
    
    const [currentOverallStep, setCurrentOverallStep] = useState(externalCurrentStep || 0);
    const [lastStepCompleted, setLastStepCompleted] = useState(false);
    const [isStep1_0Valid, setIsStep1_0Valid] = useState(false);
    const [appType, setAppType] = useState<ApplicationType>("sma_byggeprosjekter");
    const [formData, setFormData] = useState<Record<string, any>>({});

    const stepComponents: StepComponentsType = isByggeorRive ? {
        1: {
            0: Step1_0,
            1: Step1_1,
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
            1: Step4_1,
        },
        5: {
            0: Step5_0,
            1: Step5_1,
        },
        6: {
            0: Step6_0,
            1: Step6_1,
            2: Step6_2,
        },
    } : {
        1: {
            0: BruksendreStep1_0,
            1: BruksendreStep1_1,
        },
        2: {
            0: BruksendreStep2_0,
            1: BruksendreStep2_1,
            2: BruksendreStep2_2,
        },
        3: {
            0: BruksendreStep3_0,
            1: BruksendreStep3_1,
            2: BruksendreStep3_2,
        },
        4: {
            0: BruksendreStep4_0,
            1: BruksendreStep4_1,
        },
        5: {
            0: BruksendreStep5_0,
            1: BruksendreStep5_1,
        },
        6: {
            0: BruksendreStep6_0,
            1: BruksendreStep6_1,
            2: BruksendreStep6_2,
        }
    };

    const steps = [
        { title: "Oversikt", totalSubsteps: Object.keys(stepComponents[1] || {}).length },
        { title: "Dokumentsjekk", totalSubsteps: Object.keys(stepComponents[2] || {}).length },
        { title: "Nabovarsel", totalSubsteps: Object.keys(stepComponents[3] || {}).length },
        { title: "Søknaden", totalSubsteps: Object.keys(stepComponents[4] || {}).length },
        { title: "Status", totalSubsteps: Object.keys(stepComponents[5] || {}).length },
        { title: "Veien videre", totalSubsteps: Object.keys(stepComponents[6] || {}).length },
    ];

    const sjekklisteBruksendre: Record<number, string[]> = {
        1: ["Kryss av de nødvendige endringene du skal gjøre", "Skriv inn en detaljert beskrivelse av det du skal gjøre", "Besvar om tiltaket følger regulerings-/kommuneplanen", "Skriv inn avstanden til nabogrensen", "Besvar om bruksendringene kan være i konflikt med omgivelsene", "Besvar om prosjektet vil føre til en ny/endret avkjøring"],
        2: ["Last opp de nødvendige dokumentene", "Sørg for at alle dokumentene er godkjent", "Sjekk om du må søke dispensasjon", "Pass på at alle detaljene er korrekte", "Last opp andre nødvendige vedlegg"],
        3: ["Last ned en oversikt over de påvirkede naboene", "Sørg for at nabovarselen er korrekt og send varselen", "Vent til fristen for å legge igjen en merknad har gått ut. Last opp nødvendige vedlegg dersom du har fått fysiske merknader"],
        4: ["Last opp andre relevante vedlegg som du kan ha fått i etterkant", "Sørg for at all informasjonen i søknaden er korrekt"],
        5: ["Vent til søknaden er ferdig behandlet. Du kan sjekke statusen på søknaden din ved å klikke på knappen"],
    };

    const sjekklisteByggeEllerRive: Record<number, string[]> = {
        1: ["Kryss av for hvilke(n) plan(er) gjelder for din eiendom", "Kryss av for om du trenger dispensasjon elle andre tillatelser", "Fyll inn alle nødvendige felt med detaljer til det du skal bygge", "Fyll inn feltene for utnyttningsgrad", "Besvar om prosjektet kan være i konflikt med omgivelsene", "Besvar om prosjektet vil føre itl en ny/endret avkjøring", "Besvar om tiltaket er i samsvar med gjeldene plan"],
        2: ["Last opp de nødvendige dokumentene", "Sørg for at alle dokumentene er godkjent", "Sjekk om du må søke dispensasjon", "Pass på at alle detaljene er korrekte", "Last opp andre nødvendige vedlegg"],
        3: ["Last ned en oversikt over de påvirkede naboene", "Sørg for at nabovarselen er korrekt og send varselen", "Vent til fristen for å legge igjen en merknad har gått ut. Last opp nødvendige vedlegg dersom du har fått fysiske merknader"],
        4: ["Last opp andre relevante vedlegg som du kan ha fått i etterkant", "Sørg for at all informasjonen i søknaden er korrekt"],
        5: ["Vent til søknaden er ferdig behandlet. Du kan sjekke statusen på søknaden din ved å klikke på knappen"],
    }

    const currentChecklist = isBruksendre ? sjekklisteBruksendre : sjekklisteByggeEllerRive;

    const { data: application, isLoading: isLoadingApplication, refetch: refetchApplication } = api.application.getApplication.useQuery(
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
    }, [applicationID, isByggeorRive, isBruksendre]);

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
            fieldsMap['description']?.trim() !== '' &&
            fieldsMap['area_purpose']?.trim() !== '' &&
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
                refetchApplication();
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
    console.log("ProgressBarStep rendering with applicationID:", applicationID);

    const isAtSubmissionStep = currentStep === 4 && currentSubstep === 1;
    const CurrentStepComponent = stepComponents[currentStep]?.[currentSubstep];

    const isNextButtonDisabled = (currentStep === 1 && currentSubstep === 0 && !isStep1_0Valid) || submitApplication.isPending;
    const currentTasks = currentStep <= 5 ? currentChecklist[currentStep] ?? [] : [];
    const [completedTasks, setCompletedTasks] = useState<boolean[]>(Array(currentTasks.length).fill(false));

    const handleBackToMain= () => {
        router.push(`/atlas-app`);
    };

    const handleValidityChange = (isValid: boolean) => {
        if (currentStep === 1 && currentSubstep === 0) {
            setIsStep1_0Valid(isValid);
        }
    };

    const renderChecklist = () => {
        if (!isByggeorRive && !isBruksendre) return null;
        
        return (
            <div className="rounded-lg shadow-md p-4 min-w-72 h-full max-w-80 bg-blue-100 border-2 border-blue-200">
                <h2 className="text-lg font-semibold">
                    Gjøremål for Steg {currentStep}: {steps[currentStep - 1]?.title}
                </h2>
                <ul className="list-disc pl-3 space-y-2 mt-3">
                    {currentTasks.map((task, index) => {
                        const isVisible = isBruksendre
                            ? bruksendreVisibilityLogic(currentStep, currentSubstep, index)
                            : byggeEllerRiveVisibilityLogic(currentStep, currentSubstep, index);
                        const isCompleted = completedTasks[index];

                        return (
                            isVisible && (
                                <li key={index} className="flex items-start pt-1">
                                    <div className={cn("flex h-5 w-5 shrink-0 mt-0.5 items-center justify-center rounded-full border-2 mr-3 z-10 duration-500 ease-in-out",
                                        isCompleted 
                                            ? "border-green-600 bg-green-600 text-white"
                                            : "border-red-600"
                                        )}
                                    >
                                        {isCompleted ? (
                                            <Check className="h-4 w-4" />
                                        ) : (
                                            ""
                                        )}
                                    </div>
                                    <span>{task}</span>
                                </li>
                            )
                        );
                    })}
                </ul>
            </div>
        );
    };

    const bruksendreVisibilityLogic = (step: number, substep: number, index: number) => {
        if (step === 1) {
            return substep === 0 ? index < 2 : true;
        }
        if (step === 4) {
            return substep === 0 ? index === 0 : true;
        }
        return index <= substep;
    };

    const byggeEllerRiveVisibilityLogic = (step: number, substep: number, index: number) => {
        if (step === 1) {
            return substep === 0 ? index < 3 : true;
        }
        if (step === 4) {
            return substep === 0 ? index === 0 : true;
        }
        if (step === 2) {
            return index < substep + 2;
        }
        return index <= substep;
    };

    return (
        <div>
            <div className="mx-20 mt-6">
               <Button className="bg-kartAI-blue hover:bg-kartAI-lightblue w-44" onClick={handleBackToMain}>
                    Tilbake til hovedsiden
               </Button>
            </div>
            
            <div className="container px-4 flex mx-20 flex-col">
            <div className="mb-8 top-0 bg-background pt-4 pb-8 z-10">
                
                <ProgressBar steps={stepsWithStatus} />
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
        <SmallChatbot />
        </div>
        
    );
}