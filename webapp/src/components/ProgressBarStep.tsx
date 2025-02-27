"use client";

import { useState } from "react";
import { ProgressBar } from "./Progressbar";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import SjekklisteSoknad from "./SjekklisteSoknad";
import Step1_0 from "./steps/Step1_0";
import Step1_1 from "./steps/Steps1_1";
import Step2_0 from "./steps/Step2_0";
import Step2_1 from "./steps/Step2_1";


export const steps = [
        { title: "Oversikt", totalSubsteps: 3 },
        { title: "Dokumentsjekk", totalSubsteps: 3 }, 
        { title: "Nabovarsel", totalSubsteps: 3 }, 
        { title: "Søknaden", totalSubsteps: 3 }, 
        { title: "Mangel", totalSubsteps: 3 }, 
        { title: "Kvittering", totalSubsteps: 0 } 
    ];

type StepComponentsType = {
    [key: number]: {
        [subkey: number]: React.ComponentType<any>;
    };
};

const stepComponents: StepComponentsType = {
    1: {
        0: Step1_0,
        1: Step1_1,
    },
    2: {
        0: Step2_0,
        1: Step2_1,
    },
};

export default function ProgressBarStep() {
    const router = useRouter();
    const totalSubsteps = steps.reduce((acc, step) => acc + step.totalSubsteps, 0);
    const [currentOverallStep, setCurrentOverallStep] = useState(0);
    const [lastStepCompleted, setLastStepCompleted] = useState(false);

    const getCurrentStepInfo = (step = currentOverallStep) => {
        let stepIndex = 0;
        let substepCount = 0;

        while (stepIndex < steps.length) {
          const currentStep = steps[stepIndex]; 

          if (!currentStep) break; 

          if (substepCount + currentStep.totalSubsteps > step) {
            return { currentStep: stepIndex + 1, currentSubstep: step - substepCount };
          }

          substepCount += currentStep.totalSubsteps;
          stepIndex++;
        }

        return { currentStep: steps.length, currentSubstep: 0 };
      };


    const { currentStep, currentSubstep } = getCurrentStepInfo(currentOverallStep);

    const handleNext = () => {
        if (currentOverallStep < totalSubsteps) {
            setCurrentOverallStep(currentOverallStep + 1);
        } else if (!lastStepCompleted) {
            setLastStepCompleted(true);
        }
    };


    const handlePrev = () => {
        if (currentOverallStep === 0) {
            const confirmExit = window.confirm("Er du sikker på at du vil forlate siden?");
            if (confirmExit) {
                router.push("/atlas-app");
            }
        } else {
            const previousStepInfo = getCurrentStepInfo(currentOverallStep - 1);

            if (previousStepInfo.currentStep < steps.length) {
                setLastStepCompleted(false);
            }

            setCurrentOverallStep(currentOverallStep - 1);
        }
    };


    const stepsWithStatus = steps.map((step, index) => {
        const stepStart = steps.slice(0, index).reduce((acc, s) => acc + s.totalSubsteps, 0);
        const stepEnd = stepStart + step.totalSubsteps;

        if (index === steps.length - 1) {
            return {
                ...step,
                isCompleted: lastStepCompleted,
                isActive: currentOverallStep >= stepStart,
                substepsCompleted: 0,
                isLastStep: true,
                stepNumber: index + 1
            };
        }

        return {
            ...step,
            isCompleted: currentOverallStep >= stepEnd,
            isActive: currentOverallStep >= stepStart && currentOverallStep < stepEnd,
            substepsCompleted: Math.min(step.totalSubsteps, Math.max(0, currentOverallStep - stepStart)),
            isLastStep: false,
            stepNumber: index + 1
        };
    });


    const isLastStep = currentStep === steps.length;
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
                <Button onClick={handlePrev} className="bg-gray-500 hover:bg-gray-400">
                    Tilbake
                </Button>
                <Button onClick={handleNext} className="bg-kartAI-blue hover:bg-blue-900">
                    {isLastStep ? "Send inn" : "Neste"}
                </Button>
            </div>
        </div>
    );
}