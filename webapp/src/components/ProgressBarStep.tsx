"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ProgressBar } from "./Progressbar";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import SjekklisteSoknad from "./SjekklisteSoknad";
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


type StepComponentsType = {
    [key: number]: {
        [key: number]: React.ComponentType;
    };
};

const stepComponents: StepComponentsType = {
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
    { title: "Oversikt", totalSubsteps: Object.keys(stepComponents[1] || {}).length },
    { title: "Dokumentsjekk", totalSubsteps: Object.keys(stepComponents[2] || {}).length },
    { title: "Nabovarsel", totalSubsteps: Object.keys(stepComponents[3] || {}).length },
    { title: "Søknaden", totalSubsteps: Object.keys(stepComponents[4] || {}).length },
    { title: "Status", totalSubsteps: Object.keys(stepComponents[5] || {}).length },
    { title: "Veien videre", totalSubsteps: Object.keys(stepComponents[6] || {}).length },
];

export default function ProgressBarStep() {
    const router = useRouter();
    const [currentOverallStep, setCurrentOverallStep] = useState(0);
    const [lastStepCompleted, setLastStepCompleted] = useState(false);

    // Calculate total number of substeps
    const totalSubsteps = steps.reduce((acc, step) => acc + step.totalSubsteps, 0);

    // Get current step and substep based on currentOverallStep
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

    // Handle next button click
    const handleNext = () => {
        if (currentStep === 4 && currentSubstep === 0) {
            const confirmSend = window.confirm("Er du sikker på at du vil sende inn søknaden?");
            if (!confirmSend) return;
        } if (currentOverallStep < totalSubsteps - 1) {
            setCurrentOverallStep(currentOverallStep + 1);
        } else if (!lastStepCompleted) {
            setLastStepCompleted(true);
        }
    };

    // Handle previous button click
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

    // Map steps with status for the progress bar
    const stepsWithStatus = steps.map((step, index) => {
        const stepStart = steps.slice(0, index).reduce((acc, s) => acc + s.totalSubsteps, 0);
        const stepEnd = stepStart + step.totalSubsteps;
      
        // Calculate substepsCompleted based on the currentOverallStep
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
    const CurrentStepComponent = stepComponents[currentStep]?.[currentSubstep] || null;

    return (
        <div className="container mx-auto py-6 px-4 flex flex-col">
            <div className="mb-8 sticky top-0 bg-background pt-4 pb-8 z-10">
                <ProgressBar steps={stepsWithStatus} />
            </div>

            <div className="flex space-x-8 flex-1">
                <SjekklisteSoknad currentStep={currentStep} currentSubstep={currentSubstep} />
                {CurrentStepComponent && <CurrentStepComponent />}
            </div>

            <div className="flex justify-between mt-8 gap-4">
                <Button onClick={handlePrev} className="border-2 bg-white text-gray-500 border-gray-500 hover:bg-gray-500 hover:text-white w-44 ">
                    <ArrowLeft size={18} className="mr-2"/>
                    Tilbake
                </Button>
                <Button onClick={handleNext} className="border-2 bg-white text-kartAI-blue border-kartAI-blue hover:text-white hover:bg-kartAI-blue w-44">
                    {isAtSubmissionStep ? "Send inn søknaden" : "Neste"}
                    <ArrowRight size={18} className="ml-2"/>
                </Button>
            </div>
        </div>
    );
}