"use client";

import { useState, useEffect } from "react";
import { Check, X } from "lucide-react";

interface SjekklisteSoknadProps {
  currentStep: number;
  currentSubstep: number;
}

export default function SjekklisteSokad({ currentStep, currentSubstep }: SjekklisteSoknadProps) { 

const sjekkliste: { [key: number]: string[] } = {
    1: ["Upload files", "Verify document", "Submit initial form"],
    2: ["Upload additional files", "Confirm identity", "Provide references"],
    3: ["Review application", "Add supporting documents", "Final review"],
    4: ["Schedule interview", "Prepare documents", "Confirm attendance"],
    5: ["Submit final documents", "Sign agreement", "Receive confirmation"],
    6: ["Final submission"], // Only appears at the last step
};

const currentTasks = sjekkliste[currentStep] || [];
const storageKey = `step_${currentStep}_completed_tasks`;

const [completedTasks, setCompletedTasks] = useState(() => {
  if (typeof window !== "undefined") {
    const storedTasks = localStorage.getItem(storageKey);
    return storedTasks ? JSON.parse(storedTasks) : Array(currentTasks.length).fill(false);
  }
  return Array(currentTasks.length).fill(false);
});

useEffect(() => {
  if (typeof window !== "undefined") {
    localStorage.setItem(storageKey, JSON.stringify(completedTasks));
}
}, [completedTasks, storageKey]);

interface TaskToggleProps {
  index: number;
}

const toggleTaskCompletion = (index: number): void => {
  const updatedTasks = [...completedTasks];
  updatedTasks[index] = !updatedTasks[index];
  setCompletedTasks(updatedTasks);
};

  return (
    <div className="rounded-lg shadow-md border p-4 max-w-72 min-h-80 bg-gray-100">
      <h2 className="text-lg font-semibold">Gjøremål for Steg {currentStep}</h2>
      <ul className="list-disc pl-5 space-y-2 mt-2">
        {currentTasks.map((task, index) => {
          const isVisible = index <= currentSubstep;
          const isCompleted = completedTasks[index];

          return (
            isVisible && (
               <li key={index} className="flex items-center">
                {/* Logic for check and x, change logic later  */}
                <button onClick={() => toggleTaskCompletion(index)} className="focus:outline-none">
                  {isCompleted ? <Check size={24} /> : <X size={24} />} 
                </button>
                <span>{task}</span>
               </li>

            )
          )
        })}
       
        
      </ul>
    </div>
  );
}