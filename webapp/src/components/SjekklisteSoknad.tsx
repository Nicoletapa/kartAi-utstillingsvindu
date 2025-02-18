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
    1: ["Upload files", "Verify document", "Submit initial form"],
    2: ["Upload additional files", "Confirm identity", "Provide references"],
    3: ["Review application", "Add supporting documents", "Final review"],
    4: ["Schedule interview", "Prepare documents", "Confirm attendance"],
    5: ["Submit final documents", "Sign agreement", "Receive confirmation"],
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
    <div className="rounded-lg shadow-md border p-4 max-w-fit min-h-80 bg-gray-100">
      <h2 className="text-lg font-semibold">
        Gjøremål for Steg {currentStep}: {steps[currentStep - 1]?.title}
      </h2>
      <ul className="list-disc pl-5 space-y-2 mt-2">
        {currentTasks.map((task, index) => {
          const isVisible = index <= currentSubstep;
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
