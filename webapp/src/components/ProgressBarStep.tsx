"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, AlertCircle } from "lucide-react";
import { ProgressBar } from "./Progressbar";
import { Button } from "./ui/button";
import { useRouter, usePathname } from "next/navigation";
import SjekklisteSoknad from "./SjekklisteSoknad";
import {
    Step1_0, Step1_1, Step2_0, Step2_1, Step2_2,
    Step3_0, Step3_1, Step3_2, Step4_0, Step4_1, Step5_0,
    Step6_0, Step6_1, Step6_2,
} from "./steps";
import {
    BruksendreStep1_0, BruksendreStep1_1, BruksendreStep2_0, BruksendreStep2_1, BruksendreStep2_2,
    BruksendreStep3_0, BruksendreStep3_1, BruksendreStep3_2, BruksendreStep4_0, BruksendreStep4_1, BruksendreStep5_0,
    BruksendreStep6_0, BruksendreStep6_1, BruksendreStep6_2,
} from "./bruksendreSteps";


type StepComponentsType = {
    [key: number]: {
        [key: number]: React.ComponentType<any>;
    };
};


export default function ProgressBarStep() {
    const router = useRouter();
    const pathname = usePathname();
    const [currentOverallStep, setCurrentOverallStep] = useState(0);
    const [lastStepCompleted, setLastStepCompleted] = useState(false);
    const [isStep1_0Valid, setIsStep1_0Valid] = useState(false);

    const [formData, setFormData] = useState({
        size: '',
        material: '',
        ridgeHeight: '',
        eavesHeight: '',
        roofAngle: '',
        distanceToNeighbor: '',
        description: '',
        impactReason: '',
    });

    const isByggeorRive = pathname === "/atlas-app/i-soknad/bygge-eller-rive";
    const isBruksendre = pathname === "/atlas-app/i-soknad/bruksendring";

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
        },
        6: {
            0: BruksendreStep6_0,
            1: BruksendreStep6_1,
            2: BruksendreStep6_2,
        },
    }

    const steps = [
        { title: "Oversikt", totalSubsteps: Object.keys(stepComponents[1] || {}).length },
        { title: "Dokumentsjekk", totalSubsteps: Object.keys(stepComponents[2] || {}).length },
        { title: "Nabovarsel", totalSubsteps: Object.keys(stepComponents[3] || {}).length },
        { title: "Søknaden", totalSubsteps: Object.keys(stepComponents[4] || {}).length },
        { title: "Status", totalSubsteps: Object.keys(stepComponents[5] || {}).length },
        { title: "Veien videre", totalSubsteps: Object.keys(stepComponents[6] || {}).length },
    ];

    const totalSubsteps = steps.reduce((acc, step) => acc + step.totalSubsteps, 0);

    if (!isByggeorRive && !isBruksendre) {
        router.push("/404");
        return null;
    }

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

    const handleNext = () => {
        if (currentStep === 4 && currentSubstep === 1) {
            const confirmSend = window.confirm("Er du sikker på at du vil sende inn søknaden?");
            if (!confirmSend) return;
        } if (currentOverallStep < totalSubsteps - 1) {
            setCurrentOverallStep(currentOverallStep + 1);
        } else if (!lastStepCompleted) {
            setLastStepCompleted(true);
        }
    };

    const handlePrev = () => {
        if (currentOverallStep === 0) {
            const confirmExit = window.confirm("Er du sikker på at du vil forlate siden?");
            if (confirmExit) {
                router.push("/atlas-app/i-soknad/hva-vil-du-gjore");
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
    const CurrentStepComponent = stepComponents[currentStep]?.[currentSubstep] || null;
    const isNextButtonDisabled = currentStep === 1 && currentSubstep === 0 && !isStep1_0Valid;

    return (
        <div className="container mx-auto py-6 px-4 flex flex-col">
            <div className="mb-8 top-0 bg-background pt-4 pb-8 z-10">
                <ProgressBar steps={stepsWithStatus} />
            </div>

            <div className="flex space-x-8 flex-1">
                
                <SjekklisteSoknad currentStep={currentStep} currentSubstep={currentSubstep} />
                {CurrentStepComponent && (
                    <CurrentStepComponent
                        onValidityChange={setIsStep1_0Valid}
                        formData={formData}
                        setFormData={setFormData}
                    />)}
            </div>

            <div className="flex justify-between mt-8 gap-4">
                <Button onClick={handlePrev} className="border-2 bg-white text-gray-500 border-gray-500 hover:bg-gray-500 hover:text-white w-44">
                    <ArrowLeft size={18} className="mr-2" />
                    Tilbake
                </Button>
                <div className="flex items-center">
                    {isNextButtonDisabled && (
                        <div className="flex items-center mr-4 text-red-500 text-sm">
                            <AlertCircle size={16} className="mr-2 flex-shrink-0" /> 
                            <span>Alle felt må fylles ut før du kan gå videre</span>
                        </div>
                    )}
                    <Button onClick={handleNext} className="border-2 bg-white text-kartAI-blue border-kartAI-blue hover:text-white hover:bg-kartAI-blue w-44"
                        disabled={isNextButtonDisabled}>
                        {isAtSubmissionStep ? "Send inn søknaden" : "Neste"}
                        <ArrowRight size={18} className="ml-2" />
                    </Button>
                </div>
            </div>
        </div>
    );
}