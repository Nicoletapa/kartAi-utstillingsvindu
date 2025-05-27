/**
 * This file is used in Utstillingsvindu 2.0
 * 
 * @description
 * This component is used in the building application process and is rendered in ProgressBarStep.tsx.
 * It displays a checklist of tasks to be completed for the current step in the application process.
 * Certain tasks are hidden based on the current step and substep, and will be displayed when the user navigates to the next step.
 * 
 * @features
 * - Displays a checklist of tasks for the current step in the application process
 * - Hides or shows tasks based on the current step and substep
 * - Uses icons to indicate the status of each task (completed/not completed) (not yet impplemented)
 * 
 * @props
 * - `currentStep` (number): The current step in the application process.
 * - `currentSubstep` (number): The current substep in the application process.
 * - `applicationID` (number): The ID of the application .
 * -  currentStepTitle: string;
 * 
 * @note
 * - This component is designed to be used in a client-side context.
 * - It uses the `usePathname` and `useRouter` hooks from Next.js to handle routing.
 * - It uses the `useState` and `useEffect` hooks to manage the state of the checklist.
 * - It uses the `useMemo` hook to memoize the checklist data based on the current step and substep.
 * 

 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { cn } from "~/lib/utils";

interface SjekklisteSoknadProps {
  currentStep: number;
  currentSubstep: number;
  applicationID: number;
  currentStepTitle: string;
}

export default function SjekklisteSoknad({ currentStep, currentSubstep, applicationID, currentStepTitle }: SjekklisteSoknadProps) {
  const [completedTasks, setCompletedTasks] = useState<boolean[]>([]);
  const pathname = usePathname();
  const router = useRouter();

  const isByggeorRive = pathname.includes('/bygge-eller-rive');
  const isBruksendre = pathname.includes('/bruksendring');

  const sjekklisteCommon: Record<number, string[]> = {
    2: ["Last opp de nødvendige dokumentene", "Sørg for at alle dokumentene er godkjent", "Sjekk om du må søke dispensasjon", "Pass på at alle detaljene er korrekte", "Last opp andre nødvendige vedlegg"],
    3: ["Last ned en oversikt over de påvirkede naboene", "Sørg for at nabovarselen er korrekt og send varselen", "Vent til fristen for å legge igjen en merknad har gått ut. Last opp nødvendige vedlegg dersom du har fått fysiske merknader"],
    4: ["Last opp andre relevante vedlegg som du kan ha fått i etterkant", "Sørg for at all informasjonen i søknaden er korrekt"],
    5: ["Vent til søknaden er ferdig behandlet. Du kan sjekke statusen på søknaden din ved å klikke på knappen"],
  };
  
  const sjekklisteBruksendre: Record<number, string[]> = {
    1: ["Kryss av de nødvendige endringene du skal gjøre", "Skriv inn en detaljert beskrivelse av det du skal gjøre", "Besvar om tiltaket følger regulerings-/kommuneplanen", "Skriv inn avstanden til nabogrensen", "Besvar om bruksendringene kan være i konflikt med omgivelsene", "Besvar om prosjektet vil føre til en ny/endret avkjøring"]
  };

  const sjekklisteByggeEllerRive: Record<number, string[]> = {
    1: ["Kryss av for hvilke(n) plan(er) gjelder for din eiendom", "Kryss av for om du trenger dispensasjon elle andre tillatelser", "Fyll inn alle nødvendige felt med detaljer til det du skal bygge", "Fyll inn feltene for utnyttningsgrad", "Besvar om prosjektet kan være i konflikt med omgivelsene", "Besvar om prosjektet vil føre itl en ny/endret avkjøring", "Besvar om tiltaket er i samsvar med gjeldene plan"]
  };

  const currentChecklist = useMemo(() => {
    const step1Specifics = isBruksendre ? sjekklisteBruksendre : sjekklisteByggeEllerRive;
    return {
      ...step1Specifics,  
      ...sjekklisteCommon 
    };
  }, [isBruksendre, sjekklisteBruksendre, sjekklisteByggeEllerRive, sjekklisteCommon]); 
  
  useEffect(() => {
    if (!applicationID) {
      console.warn("No applicationID provided to SjekklisteSoknad");
      return;
    }

    if (!isByggeorRive && !isBruksendre) {
      router.push(`/404/${applicationID}`);
    }
  }, [isByggeorRive, isBruksendre, applicationID, router]);

  useEffect(() => {
    const currentTasks = currentStep <= 5 ? currentChecklist[currentStep] ?? [] : [];
    if (completedTasks.length !== currentTasks.length) {
      setCompletedTasks(Array(currentTasks.length).fill(false));
    }
  }, [currentStep, currentChecklist, completedTasks.length]);

  if (!isByggeorRive && !isBruksendre) {
    return null;
  }

  

  const currentTasks = currentStep <= 5 ? currentChecklist[currentStep] ?? [] : [];

  const bruksendreVisibilityLogic = (step: number, substep: number, index: number) => {
    if (step === 1) {
        return substep === 0 ? index < 3 : true;
    }
    if (step === 4) {
        return substep === 0 ? index === 0 : true;
    }
    return index <= substep;
  };

  const byggeEllerRiveVisibilityLogic = (step: number, substep: number, index: number) => {
    if (step === 1) {
        return substep === 0 ? index < 3 : true;
    }
    if (step === 4) {
        return substep === 0 ? index === 0 : true;
    }
    if (step === 2) {
        return index < substep + 2;
    }
    return index <= substep;
  };
  
  return (
    <div className="rounded-lg shadow-md p-4 min-w-72 h-fit max-w-80 bg-blue-100 border-2 border-blue-200">
      <h2 className="text-lg font-semibold">
        Gjøremål for Steg {currentStep}: {currentStepTitle}
      </h2>
      <ul className="list-disc pl-3 space-y-2 mt-3">
        {currentTasks.map((task, index) => {
          const isVisible = isBruksendre
            ? bruksendreVisibilityLogic(currentStep, currentSubstep, index)
            : byggeEllerRiveVisibilityLogic(currentStep, currentSubstep, index);
          const isCompleted = completedTasks[index];

          return (
            isVisible && (
              <li key={index} className="flex items-start pt-1">
                <div className={cn(
                  "flex h-5 w-5 shrink-0 mt-0.5 items-center justify-center rounded-full border-2 mr-3 z-10 duration-500 ease-in-out",
                  isCompleted 
                    ? "border-green-600 bg-green-600 text-white"
                    : "border-red-600"
                )}>
                  {isCompleted && <Check className="h-4 w-4" />}
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