import { ApplicationType } from "@prisma/client";

// Main application type display names
export const APPLICATION_TYPE_DISPLAY_NAMES: Record<string, string> = {
  [ApplicationType.sma_byggeprosjekter]: "Små byggeprosjekter",
  [ApplicationType.bruksendring]: "Bruksendring",
  [ApplicationType.pending]: "Under behandling",
};

