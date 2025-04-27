import { ApplicationType } from "@prisma/client";

// Main application type display names
export const APPLICATION_TYPE_DISPLAY_NAMES: Record<string, string> = {
  [ApplicationType.sma_byggeprosjekter]: "Små byggeprosjekter",
  [ApplicationType.bruksendring]: "Bruksendring",
  [ApplicationType.pending]: "Under behandling",
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
      id: "bygge",
      name: "Bygge",
      description: "For nye byggverk, tilbygg eller påbygg"
    },
    {
      id: "rive",
      name: "Rive",
      description: "For riving av eksisterende byggverk"
    }
  ],
  [ApplicationType.bruksendring]: [
    {
      id: "bruksendring",
      name: "Bruksendring",
      description: "For endring av bruksformål for eksisterende bygninger"
    }
  ],
  [ApplicationType.pending]: [
    {
      id: "pending",
      name: "Under behandling",
      description: "Søknad under behandling"
    }
  ]
};