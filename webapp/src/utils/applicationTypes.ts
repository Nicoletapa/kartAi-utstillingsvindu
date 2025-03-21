import { ApplicationType } from "@prisma/client";

export const APPLICATION_TYPE_DISPLAY_NAMES: Record<string, string> = {
  [ApplicationType.sma_byggeprosjekter]: "Små byggeprosjekter",
  [ApplicationType.sma_byggeprosjekter_med_dispensasjon]: "Små byggeprosjekter med dispensasjon",
  [ApplicationType.bruksendring]: "Bruksendring",
  [ApplicationType.bruksendring_med_dispensasjon]: "Bruksendring med dispensasjon",
  
};