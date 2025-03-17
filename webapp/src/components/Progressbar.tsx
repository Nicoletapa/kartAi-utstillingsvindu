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
}

interface StepperProps {
  steps: StepProps[]
}

const Step: React.FC<StepProps> = ({ title, isCompleted, isActive, substepsCompleted, totalSubsteps, isLastStep, stepNumber }) => {
  return (
    <div className="flex flex-col items-center flex-1 min-w-0">
      {/* Main Step Circle and Substeps */}
      <div className="flex items-center w-full">
        <div className="flex flex-col items-center relative">
        {/* Main Step Circle */}
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border z-10 duration-500 ease-in-out",
            isCompleted
              ? "border-kartAI-blue bg-kartAI-blue text-primary-foreground"
              : isActive
              ? "border-kartAI-blue"
              : "border-muted-foreground"
          )}
        >
          {isCompleted ? 
            <Check className="h-6 w-6" />
           :
            <span className="text-sm font-medium">{stepNumber}</span>
          }
        </div>
        {/* Step Title */}
      <h3 className="mt-1 text-sm font-semibold text-center truncate max-w-none">
        {title}
      </h3>
      </div>

        {/* Substeps and Connector Lines */}
        <div className="flex-1 flex items-center mb-5">
          {Array.from({ length: totalSubsteps }).map((_, index) => (
            <React.Fragment key={index}>
              <div
                className={cn(
                  "flex-1 h-[2px] duration-200 ease-in-out",
                  index < substepsCompleted ? "bg-kartAI-blue" : "bg-muted-foreground/30"
                )}
              />
              <div
                className={cn(
                  "h-4 w-4 rounded-full border shrink-0 z-10 duration-500 ease-in-out",
                  index < substepsCompleted ? "border-kartAI-blue bg-kartAI-blue" : "border-muted-foreground"
                )}
              />
            </React.Fragment>
          ))}
          {!isLastStep && (
            <div
              className={cn(
                "flex-1 h-[2px]",
                isCompleted ? "bg-kartAI-blue" : "bg-muted-foreground/30"
              )}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export const ProgressBar: React.FC<StepperProps> = ({ steps }) => {
  return (
    <div className="w-full">
      <div className="flex items-start">
        {steps.map((step, index) => (
          <Step key={index} {...step} isLastStep={index === steps.length - 1} stepNumber={index + 1} />
        ))}
      </div>
    </div>
  )
}