"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { steps } from "./ProgressBarStep";
import { cn } from "~/lib/utils";

interface SjekklisteSoknadProps {
  currentStep: number;
  currentSubstep: number;
}

export default function SjekklisteSoknad({ currentStep, currentSubstep }: SjekklisteSoknadProps) { 
  const sjekkliste: Record<number, string[]> = {
    1: ["Skriv inn hva tiltaket er", "Fyll inn de nødvendige bygningsdetaljene", "Skriv inn begrunnelsen for tiltaket"],
    2: ["Last opp de nødvendige dokumentene", "Sørg for at alle dokumentene er godkjent", "Disp", "Vedlegg"],
    3: ["Last ned en oversikt over de påvirkede naboene", "Sørg for at nabovarselen er korrekt og send varselen", "Vent til fristen for å legge igjen en merknad har gått ut. Last opp nødvendige vedlegg dersom du har fått fysiske merknader"],
    4: ["Sørg for at søknaden er korrekt. Du kan sende byggesøknaden dersom alt er til dine behov"],
    5: ["Vent til søknaden er ferdig behandlet. Du kan sjekke statusen på søknaden din ved å klikke på knappen"],
    6: ["Final submission"] 
  };

  const currentTasks = sjekkliste[currentStep] ?? [];

  const [completedTasks, setCompletedTasks] = useState<boolean[]>(Array(currentTasks.length).fill(false));

  return (
    <div className="rounded-lg shadow-md border-2 p-4 min-w-72 max-w-80 max-h-80 bg-gray-100">
      <h2 className="text-lg font-semibold">
        Gjøremål for Steg {currentStep}: {steps[currentStep - 1]?.title}
      </h2>
      <ul className="list-disc pl-3 space-y-2 mt-3">
        {currentTasks.map((task, index) => {
          const isVisible = currentStep === 1 
          ? true 
          : currentStep === 2 
            ? index < currentSubstep + 2 
            : index <= currentSubstep;
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
}
