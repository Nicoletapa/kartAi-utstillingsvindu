/**
 * This file is used in Utstillingsvindu 2.0
 * 
 * @description
 * This is part of the ProgressBarStep.tsx component, in the building application process.
 * It contains the styling of the progress bar and provides a visual representation of the progress through a series of steps.
 * Each step can have multiple substeps, and the component allows for interaction with both main steps and substeps.
 * 
 * @features
 * - Visual representation of progress through steps
 * - Clickable main steps and substeps
 * - Dynamic styling based on completion and activity status
 * 
 * @props
 * - `steps` (array): An array of step objects, each containing properties like title, completion status, and substep details.
 * - `onStepClick` (function): A callback function to handle clicks on main steps and substeps.
 * 
 * @note
 * - This component is designed to be used in a client-side context.
 * - It uses the `cn` utility function for conditional class names.
 * 
 * @usage
 * <ProgressBar 
 *    steps={stepsWithStatus}
 *    onStepClick={(stepIndex, substepIndex) => {
 *        const absoluteIndex = getAbsoluteStepIndex(stepIndex, substepIndex);
 *        setCurrentOverallStep(absoluteIndex);
 *    }}
 * />
 */

import React from "react"
import { Check } from "lucide-react"
import { cn } from "~/lib/utils"

interface StepProps {
  title: string
  isCompleted: boolean
  isActive: boolean
  substepsCompleted: number
  totalSubsteps: number
  isLastStep: boolean
  stepNumber: number
  isFirstStep: boolean
  onMainStepClick?: () => void
  onSubstepClick?: (substepIndex: number) => void
}

interface StepperProps {
  steps: Omit<StepProps, "isLastStep" | "isFirstStep" | "stepNumber">[]
  onStepClick?: (stepIndex: number, substepIndex?: number) => void
}

const Step: React.FC<StepProps> = ({
  title,
  isCompleted,
  isActive,
  substepsCompleted,
  totalSubsteps,
  isLastStep,
  stepNumber,
  isFirstStep,
  onMainStepClick,
  onSubstepClick,
}) => {
  const hasSingleSubstep = totalSubsteps === 1;
  
  return (
    <div className="flex flex-col items-center flex-1 min-w-0">
      <div className="flex items-center w-full relative">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border z-10 duration-500 ease-in-out",
            isCompleted
              ? "border-kartAI-blue bg-kartAI-blue text-primary-foreground"
              : isActive
              ? "border-kartAI-blue"
              : "border-muted-foreground",
              onMainStepClick ? "cursor-pointer hover:bg-gray-100" : "cursor-default"
          )}
          onClick={onMainStepClick}
        >
          {isCompleted ? (
            <Check className="h-6 w-6" />
          ) : (
            <span className="text-sm font-medium">{stepNumber}</span>
          )}
        </div>

        <div className="flex-1 flex items-center">
          {Array.from({ length: totalSubsteps }).map((_, index) => (
            <React.Fragment key={index}>
              <div
                className={cn(
                  "flex-1 h-[2px] duration-200 ease-in-out",
                  (isFirstStep && index === 0) || 
                  (index <= substepsCompleted && (isCompleted || isActive)) 
                    ? "bg-kartAI-blue"
                    : "bg-muted-foreground/30",
                  hasSingleSubstep ? "max-w-[44px]" : ""
                )}
              />
              <div
                className={cn(
                  "h-4 w-4 rounded-full border shrink-0 z-10 duration-500 ease-in-out",
                  (isFirstStep && index === 0) || 
                  (index < substepsCompleted && (isCompleted || isActive)) 
                    ? "border-kartAI-blue bg-kartAI-blue"
                    : "border-muted-foreground",
                  onSubstepClick ? "cursor-pointer hover:scale-110" : "cursor-default"
                )}
                onClick={() => onSubstepClick?.(index)}
              />
            </React.Fragment>
          ))}
          {!isLastStep && (
            <div
              className={cn(
                "flex-1 h-[2px]",
                (isCompleted || substepsCompleted === totalSubsteps)
                  ? "bg-kartAI-blue"
                  : "bg-muted-foreground/30",
                hasSingleSubstep ? "max-w-[20px]" : ""
              )}
            />
          )}
        </div>
      </div>

      <h3 className="mt-1 mr-44 ml-3 text-sm font-semibold text-center truncate max-w-none">
        {title}
      </h3>
    </div>
  );
};

export const ProgressBar: React.FC<StepperProps> = ({ steps, onStepClick }) => {
  return (
    <div className="w-full">
      <div className="flex items-start">
        {steps.map((step, index) => (
          <Step 
            key={index} 
            {...step} 
            isLastStep={index === steps.length - 1} 
            isFirstStep={index === 0} 
            stepNumber={index + 1} 
            onMainStepClick={() => onStepClick?.(index)}
            onSubstepClick={(substepIndex) => onStepClick?.(index, substepIndex)}
          />
        ))}
      </div>
    </div>
  )
}