// "use client";

// import { useState, useEffect } from "react";
// import { usePathname, useRouter } from "next/navigation";
// import { Check } from "lucide-react";
// import { cn } from "~/lib/utils";

// import {
//   Step1_0, Step1_1, Step2_0, Step2_1, Step2_2,
//   Step3_0, Step3_1, Step3_2, Step4_0, Step4_1, Step5_0,
// } from "./steps";
// import {
//   BruksendreStep1_1, BruksendreStep2_0, BruksendreStep2_1, BruksendreStep2_2,
//   BruksendreStep3_0, BruksendreStep3_1, BruksendreStep3_2, BruksendreStep4_0, BruksendreStep4_1, BruksendreStep5_0,
// } from "./bruksendreSteps";

// interface SjekklisteSoknadProps {
//   currentStep: number;
//   currentSubstep: number;
//   applicationID?: number ;
// }

// type StepComponentsType = Record<number, Record<number, React.ComponentType>>;

// export default function SjekklisteSoknad({ currentStep, currentSubstep, applicationID }: SjekklisteSoknadProps) {
//   // Move useState hook before any conditional returns
//   const [completedTasks] = useState<boolean[]>([]); // Initialize empty, will be updated based on currentTasks later if needed, or remove if truly unused

//   const sjekkliste: Record<number, string[]> = {
//     1: ["Kryss av de nødvendige endringene du skal gjøre", "Skriv inn en detaljert beskrivelse av det du skal gjøre", "Besvar om tiltaket følger regulerings-/kommuneplanen"],
//     2: ["Last opp de nødvendige dokumentene", "Sørg for at alle dokumentene er godkjent", "Sjekk om du må søke dispensasjon", "Pass på at alle detaljene er korrekte","Last opp andre nødvendige vedlegg"],
//     3: ["Last ned en oversikt over de påvirkede naboene", "Sørg for at nabovarselen er korrekt og send varselen", "Vent til fristen for å legge igjen en merknad har gått ut. Last opp nødvendige vedlegg dersom du har fått fysiske merknader"],
//     4: ["Sørg for at søknaden er korrekt. Du kan sende byggesøknaden dersom alt er til dine behov"],
//     5: ["Vent til søknaden er ferdig behandlet. Du kan sjekke statusen på søknaden din ved å klikke på knappen"],
//   };

//   const pathname = usePathname();
//   const router = useRouter();

//   const isByggeorRive = pathname.includes('/bygge-eller-rive');
//   const isBruksendre = pathname.includes('/bruksendring');

//   useEffect(() => {
//     if (!applicationID) {
//       console.warn("No applicationID provided to SjekklisteSoknad");
//       return;
//     }

//     if (!isByggeorRive && !isBruksendre) {
//       router.push(`/404/${applicationID}`);
//     }
//   }, [isByggeorRive, isBruksendre, applicationID, router]);

//   if (!isByggeorRive && !isBruksendre) {
//     return null; // Early return
//   }

//   const stepComponents: StepComponentsType = isByggeorRive ? {
//     1: {
//         0: Step1_0,
//         1: Step1_1,
//     },
//     2: {
//         0: Step2_0,
//         1: Step2_1,
//         2: Step2_2,
//     },
//     3: {
//         0: Step3_0,
//         1: Step3_1,
//         2: Step3_2,
//     },
//     4: {
//         0: Step4_0,
//         1: Step4_1,
//     },
//     5: {
//         0: Step5_0,
//     },

//   } : {
//     1: {
//         0: BruksendreStep1_1,
//     },
//     2: {
//         0: BruksendreStep2_0,
//         1: BruksendreStep2_1,
//         2: BruksendreStep2_2,
//     },
//     3: {
//         0: BruksendreStep3_0,
//         1: BruksendreStep3_1,
//         2: BruksendreStep3_2,
//     },
//     4: {
//         0: BruksendreStep4_0,
//         1: BruksendreStep4_1,
//     },
//     5: {
//         0: BruksendreStep5_0,
//     },
//   }

//   const steps = [
//     { title: "Oversikt", totalSubsteps: Object.keys(stepComponents[1] ?? {}).length },
//     { title: "Dokumentsjekk", totalSubsteps: Object.keys(stepComponents[2] ?? {}).length },
//     { title: "Nabovarsel", totalSubsteps: Object.keys(stepComponents[3] ?? {}).length },
//     { title: "Søknaden", totalSubsteps: Object.keys(stepComponents[4] ?? {}).length },
//     { title: "Status", totalSubsteps: Object.keys(stepComponents[5] ?? {}).length },
//     { title: "Veien videre", totalSubsteps: Object.keys(stepComponents[6] ?? {}).length },
//   ];

//   const currentTasks = currentStep <= 5 ? sjekkliste[currentStep] ?? [] : [];

//   return (
//     <div className="rounded-lg shadow-md p-4 min-w-72 h-full max-w-80 bg-blue-100 border-2 border-blue-200">
//       <h2 className="text-lg font-semibold">
//         Gjøremål for Steg {currentStep}: {steps[currentStep - 1]?.title}
//       </h2>
//       <ul className="list-disc pl-3 space-y-2 mt-3">
//         {currentTasks.map((task, index) => {
//           const isVisible = currentStep === 1
//           ? true
//           : currentStep === 2
//             ? index < currentSubstep + 2
//             : index <= currentSubstep;
//           const isCompleted = completedTasks[index]; // Reading from state

//           return (
//             isVisible && (
//               <li key={index} className="flex items-start pt-1">
//                 <div className={cn("flex h-5 w-5 shrink-0 mt-0.5 items-center justify-center rounded-full border-2 mr-3 z-10 duration-500 ease-in-out",
//                   isCompleted 
//                   ? "border-green-600 bg-green-600 text-white"
//                   : "border-red-600"
//                 )}
//                 >
//                 {isCompleted ? (
//                   <Check className="h-4 w-4" />
//                 ) : (
//                   ""
//                 )}
//                 </div>
//                 <span>{task}</span>
//               </li>
//             )
//           );
//         })}
//       </ul>
//     </div>
//   );
// }
