import { z } from "zod";

const buildingInputs = [
  { name: "size", label: "Størrelse:", placeholder: "F.eks. 24", unit: "m²" },
  {
    name: "mønehøyde",
    label: "Mønehøyde:",
    placeholder: "F.eks. 4.5",
    unit: "meter",
  },
  {
    name: "gesimshøyde",
    label: "Gesimshøyde:",
    placeholder: "F.eks. 3.5",
    unit: "meter",
  },
  {
    name: "distance_va",
    label: "Avstand til VA-ledninger:",
    placeholder: "F.eks. 4",
    unit: "meter",
  },
  {
    name: "distance_high_voltage_lines",
    label: "Avstand til strømkabler:",
    placeholder: "F.eks. 3",
    unit: "meter",
  },
  {
    name: "distance_road",
    label: "Avstand til vei:",
    placeholder: "F.eks. 5",
    unit: "meter",
  },
];

const distanceInputs = [
  {
    name: "neighbor_boundary",
    label: "Nabogrense:",
    placeholder: "F.eks. 4",
    unit: "meter",
  },
  {
    name: "road_center",
    label: "Midten av vei:",
    placeholder: "F.eks. 6",
    unit: "meter",
  },
  {
    name: "nearest_building",
    label: "Nærmeste bygning på naboeiendom:",
    placeholder: "F.eks. 5",
    unit: "meter",
  },
];

const buildingDensityInputs = [
  {
    name: "allowed_utilization",
    label: "Tillatt grad av utnytting:",
    unit: "",
    wideLabel: true,
  },
  {
    name: "property_net_area",
    label: "Tomtens nettoareal:",
    unit: "m²",
    wideLabel: true,
  },
  {
    name: "current_area",
    label: "Areal av bygninger, konstruksjoner og parkering i dag:",
    unit: "m²",
    wideLabel: true,
  },
  {
    name: "future_area",
    label: "Areal av bygninger, konstruksjoner og parkering etterpå:",
    unit: "m²",
    wideLabel: true,
  },
  {
    name: "utilization_after_project",
    label: "Grad av utnytting etter prosjekt:",
    unit: "",
    wideLabel: true,
  },
];

const calculationMethodOptions = [
  { label: "BYA -", value: "Bebygd areal i m²" },
  { label: "BRA -", value: "Bruksarea i m²" },
  { label: "T-BRA -", value: "Tillatt bruksareal i m²" },
  { label: "%BYA -", value: "Bebygd areal i %" },
  { label: "%BRA -", value: "Bruksareal i %" },
  { label: "%TU -", value: "Tillatt utnyttelsesgrad i %" },
  {
    label: "U-grad",
    value: "(denne betegnelsen brukes i enkelte eldre planer)",
  },
];

const environmentalConflictGroups = [
  [
    {
      name: "distance_train_tracks",
      label: "Er det mindre enn 30 meter til nærmeste trikke-eller togspor?",
    },
    {
      name: "distance_water_sewer_pipes",
      label: "Bygger/river du i nærheten av en vann- og avløpsledning?",
    },
    {
      name: "distance_high_voltage_lines",
      label: "Bygger/river du i nærheten av høyspent kraftlinje?",
    },
  ],
  [
    {
      name: "near_beach_or_river",
      label:
        "Bygger/river du i nærheten av strandsonen eller sjø/elv/vassdrag?",
    },
    {
      name: "in_flood_risk_area",
      label: "Skal du bygge/rive i et flom-, ras- eller skredutsatt område?",
    },
    {
      name: "protected_species_present",
      label:
        "Finnes det truende eller vernede arter på eiendommen er i nærheten?",
    },
    {
      name: "cultural_heritage_site",
      label:
        "Finnes det kulturminner eller verneverdig bebyggelse på eiendommen eller i nærheten?",
    },
  ],
];

const smaProsjekterStep1_1Schema = z
  .object({
    size: z.string().trim().min(1, { message: "Størrelse må fylles ut" }),
    mønehøyde: z.string().trim().min(1, { message: "Mønehøyde må fylles ut" }),
    gesimshøyde: z
      .string()
      .trim()
      .min(1, { message: "Gesimshøyde må fylles ut" }),
    distance_road: z
      .string()
      .trim()
      .min(1, { message: "Avstand til vei må fylles ut" }),
    road_center: z
      .string()
      .trim()
      .min(1, { message: "Avstand til midten av vei må fylles ut" }),
    neighbor_boundary: z
      .string()
      .trim()
      .min(1, { message: "Avstand til nabogrense må fylles ut" }),
    nearest_building: z
      .string()
      .trim()
      .min(1, { message: "Avstand til nærmeste bygning må fylles ut" }),

    calculation_method: z
      .array(z.string())
      .min(1, { message: "Minst én beregningsmåte må velges" }),

    distance_train_tracks: z.enum(["Ja", "Nei"], {
      required_error: "Svar på avstand til togspor er påkrevd",
    }),
    distance_water_sewer_pipes: z.enum(["Ja", "Nei"], {
      required_error: "Svar på avstand til vann-/avløpsledninger er påkrevd",
    }),
    distance_high_voltage_lines: z.enum(["Ja", "Nei"], {
      required_error: "Svar på avstand til høyspentlinjer er påkrevd",
    }),
    in_flood_risk_area: z.enum(["Ja", "Nei"], {
      required_error: "Svar på flomutsatt område er påkrevd",
    }),
    near_beach_or_river: z.enum(["Ja", "Nei"], {
      required_error: "Svar på nærhet til strand/elv er påkrevd",
    }),
    protected_species_present: z.enum(["Ja", "Nei"], {
      required_error: "Svar på truende/vernede arter er påkrevd",
    }),
    cultural_heritage_site: z.enum(["Ja", "Nei"], {
      required_error: "Svar på kulturminner er påkrevd",
    }),

    allowed_utilization: z
      .string()
      .trim()
      .min(1, { message: "Tillatt grad av utnytting må fylles ut" }),
    property_net_area: z
      .string()
      .trim()
      .min(1, { message: "Tomtens nettoareal må fylles ut" }),
    current_area: z
      .string()
      .trim()
      .min(1, { message: "Nåværende areal må fylles ut" }),
    future_area: z
      .string()
      .trim()
      .min(1, { message: "Fremtidig areal må fylles ut" }),
    utilization_after_project: z
      .string()
      .trim()
      .min(1, { message: "Grad av utnytting etter prosjekt må fylles ut" }),

    new_driveway: z.enum(["Ja", "Nei"], {
      required_error: "Svar på ny/endret avkjørsel er påkrevd",
    }),
    road_type: z.string().optional(), // Valgfri, men blir påkrevd hvis new_driveway er 'Ja'

    planCompliance: z.enum(["Ja", "Nei"], {
      required_error: "Svar på samsvar med plan er påkrevd",
    }),
    nonComplianceReason: z.string().optional(), // Valgfri, men blir påkrevd hvis planCompliance er 'Nei'
  })
  .superRefine((data, ctx) => {
    // Betinget validering for road_type
    if (
      data.new_driveway === "Ja" &&
      (data.road_type === undefined || data.road_type.trim() === "")
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Type vei må spesifiseres når ny/endret avkjørsel er 'Ja'",
        path: ["road_type"],
      });
    }
    // Betinget validering for nonComplianceReason
    if (
      data.planCompliance === "Nei" &&
      (data.nonComplianceReason === undefined ||
        data.nonComplianceReason.trim() === "")
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Begrunnelse må fylles ut når tiltaket ikke er i samsvar med plan",
        path: ["nonComplianceReason"],
      });
    }
  });

export {
  environmentalConflictGroups,
  calculationMethodOptions,
  buildingDensityInputs,
  distanceInputs,
  buildingInputs,
  smaProsjekterStep1_1Schema,
};
