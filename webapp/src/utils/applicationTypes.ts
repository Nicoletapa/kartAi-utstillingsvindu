import { ApplicationType } from "@prisma/client";

// Main application type display names
export const APPLICATION_TYPE_DISPLAY_NAMES: Record<string, string> = {
  [ApplicationType.sma_byggeprosjekter]: "Små byggeprosjekter",
  [ApplicationType.bruksendring]: "Bruksendring",
  [ApplicationType.pending]: "Venter", // Optional: Add display name if needed
};

// Subtypes for each main application type
export interface SubType {
  id: string;
  name: string;
  description: string;
}

export const APPLICATION_SUBTYPES: Record<ApplicationType, SubType[]> = {
  [ApplicationType.sma_byggeprosjekter]: [
    {
      id: "bygge_tilbygg", // Match IDs used in ProjectType.tsx
      name: "Bygge Tilbygg",
      description: "For nye tilbygg mindre enn 50m²"
    },
    {
      id: "bygge_frittliggende", // Match IDs used in ProjectType.tsx
      name: "Bygge Frittliggende",
      description: "For frittliggende bygning mindre enn 70m²"
    },
    {
      id: "bygge_annet", // Match IDs used in ProjectType.tsx
      name: "Bygge Annet",
      description: "Annet (kun etter avtale med kommunen)"
    },
    {
      id: "rive_tilbygg", // Match IDs used in ProjectType.tsx
      name: "Rive Tilbygg",
      description: "For riving av tilbygg mindre enn 50m²"
    },
    {
      id: "rive_frittliggende", // Match IDs used in ProjectType.tsx
      name: "Rive Frittliggende",
      description: "For riving av frittliggende bygning mindre enn 70m²"
    },
    {
      id: "rive_annet", // Match IDs used in ProjectType.tsx
      name: "Rive Annet",
      description: "Annet (kun etter avtale med kommunen)"
    }
  ],
  [ApplicationType.bruksendring]: [
    {
      id: "standard", // Match ID used in ProjectType.tsx
      name: "Bruksendring",
      description: "For endring av bruksformål for eksisterende bygninger"
    }
  ],
  [ApplicationType.pending]: [] // Add entry for the 'pending' type
};