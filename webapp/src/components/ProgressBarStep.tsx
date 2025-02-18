"use client";

import { useState } from "react";
import { ProgressBar } from "./Progressbar";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";


export const steps = [
        { title: "Oversikt", totalSubsteps: 3 },
        { title: "Dokumentsjekk", totalSubsteps: 3 }, 
        { title: "Nabovarsel", totalSubsteps: 3 }, 
        { title: "Søknaden", totalSubsteps: 3 }, 
        { title: "Mangel", totalSubsteps: 3 }, 
        { title: "Kvittering", totalSubsteps: 0 } 
    ];

export default function ProgressBarStep() {
    const router = useRouter();
    const totalSubsteps = steps.reduce((acc, step) => acc + step.totalSubsteps, 0);
    const [currentOverallStep, setCurrentOverallStep] = useState(0);

    const getCurrentStepInfo = () => {
        let stepIndex = 0;
        let substepCount = 0;
      
        while (stepIndex < steps.length - 1) {
          const currentStep = steps[stepIndex]; // Get the step safely
      
          if (!currentStep) break; // Prevent accessing an undefined object
      
          if (substepCount + currentStep.totalSubsteps > currentOverallStep) {
            return {
              currentStep: stepIndex,
              currentSubstep: currentOverallStep - substepCount,
            };
          }
      
          substepCount += currentStep.totalSubsteps;
          stepIndex++;
        }
      
        return { currentStep: steps.length - 1, currentSubstep: 0 };
      };
      

    const { currentStep, currentSubstep } = getCurrentStepInfo();

    const handleNext = () => {
        if (currentOverallStep < totalSubsteps) {
            setCurrentOverallStep(currentOverallStep + 1);
        } else if (currentStep === steps.length - 1) {
            setCurrentOverallStep(currentOverallStep + 1);
        }
    };

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

        if (index === steps.length - 1) {
            return {
                ...step,
                isCompleted: currentOverallStep > totalSubsteps, 
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

    const isLastStep = currentStep === steps.length - 1;
    const currentStepInfo = getCurrentStepInfo();
    const currentStepData = steps[currentStepInfo.currentStep] ?? { title: "Unknown", totalSubsteps: 0 };


    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-8 sticky top-0 bg-background pt-4 pb-8 z-10">
                <ProgressBar steps={stepsWithStatus} />
            </div>
            <div className="space-y-8">
                <h1 className="text-3xl font-bold">{currentStepData.title}</h1>
                {!isLastStep && (
                    <p className="text-lg text-muted-foreground">
                        Deltrinn {currentSubstep + 1} av {currentStepData.totalSubsteps}
                    </p>
                )}
                <div className="flex justify-between fixed bottom-16 left-1/2 transform -translate-x-1/2 gap-4">
                    <Button onClick={handlePrev} className="bg-gray-500 hover:bg-gray-400">
                        Tilbake
                    </Button>
                    <Button onClick={handleNext} disabled={isLastStep && currentOverallStep > totalSubsteps} className="bg-kartAI-blue hover:bg-blue-900">
                        {isLastStep ? "Send inn" : "Neste"}
                    </Button>
                </div>
            </div>
        </div>
    );
}