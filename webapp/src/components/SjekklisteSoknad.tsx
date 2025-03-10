"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { steps } from "./ProgressBarStep";

interface SjekklisteSoknadProps {
  currentStep: number;
  currentSubstep: number;
}

export default function SjekklisteSoknad({ currentStep, currentSubstep }: SjekklisteSoknadProps) { 
  const sjekkliste: Record<number, string[]> = {
    1: ["Skriv inn hva tiltaket er", "Fyll inn de nødvendige bygningsdetaljene", "Skriv inn begrunnelsen for tiltaket"],
    2: ["Last opp de nødvendige dokumentene", "Sørg for at alle dokumentene er godkjent"],
    3: ["Last ned en oversikt over de påvirkede naboene", "Sørg for at nabovarselen er korrekt og send varselen", "Vent til fristen for å legge igjen en merknad har gått ut. Last opp nødvendige vedlegg dersom du har fått fysiske merknader"],
    4: ["Sørg for at søknaden er korrekt. Du kan sende byggesøknaden dersom alt er til dine behov"],
    5: ["Vent til søknaden er ferdig behandlet. Du kan sjekke statusen på søknaden din ved å klikke på knappen"],
    6: ["Final submission"] 
  };

  const currentTasks = sjekkliste[currentStep] ?? [];

  const [completedTasks, setCompletedTasks] = useState<boolean[]>(Array(currentTasks.length).fill(false));

  const toggleTaskCompletion = (index: number): void => {
    setCompletedTasks((prev) => {
      const updatedTasks = [...prev];
      updatedTasks[index] = !updatedTasks[index];
      return updatedTasks;
    });
  };

  return (
    <div className="rounded-lg shadow-md border p-4 min-w-72 max-w-80 max-h-80 bg-gray-100">
      <h2 className="text-lg font-semibold">
        Gjøremål for Steg {currentStep}: {steps[currentStep - 1]?.title}
      </h2>
      <ul className="list-disc pl-5 space-y-2 mt-2">
        {currentTasks.map((task, index) => {
          const isVisible = currentStep === 1 || currentStep === 2 || index <= currentSubstep;
          const isCompleted = completedTasks[index];

          return (
            isVisible && (
              <li key={index} className="flex items-center">
                <button onClick={() => toggleTaskCompletion(index)} className="focus:outline-none mr-2">
                  {isCompleted ? <Check size={18} className="text-green-600" /> : <X size={18} className="text-red-600" />} 
                </button>
                <span>{task}</span>
              </li>
            )
          );
        })}
      </ul>
    </div>
  );
}
