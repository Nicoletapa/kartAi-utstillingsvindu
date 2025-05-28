interface ApplicationField {
  fieldName: string;
  fieldValue: string;
}

// This should match the structure of your `appData` from the API
interface RawApplicationData {
  application_fields: ApplicationField[];
  applicationType?: string;
}

// This should match your ApplicationData state interface in Dispensasjon.tsx
export interface TransformedApplicationData {
  kommune?: string;
  avdeling?: string;
  adresse?: string;
  postInfo?: string;
  telefon?: string;
  epost?: string;
  saksnummer?: string;
  soker?: string;
  sokerAdresse?: string;
  eiendomAdresse?: string;
  gbnr?: string;
  tiltakType?: string;
  storrelse?: number;
  materiale?: string;
  hoyde?: number;
  takvinkel?: number;
  nabogrense?: number;
  beskrivelse?: string;
}

const findFieldValue = (
  fields: ApplicationField[],
  fieldName: string,
): string | undefined => {
  return fields.find((field) => field.fieldName === fieldName)?.fieldValue;
};

const findNumericFieldValue = (
  fields: ApplicationField[],
  fieldName: string,
): number | undefined => {
  const value = findFieldValue(fields, fieldName);
  return value ? Number(value) || undefined : undefined;
};

export const transformApplicationData = (
  appData: RawApplicationData | null | undefined,
): TransformedApplicationData => {
  if (!appData) {
    return {}; // Return empty object or default values if appData is not available
  }

  const fields = appData.application_fields || [];

  return {
    kommune: findFieldValue(fields, "kommune"),
    avdeling: findFieldValue(fields, "avdeling"),
    adresse: findFieldValue(fields, "adresse"),
    postInfo: findFieldValue(fields, "postInfo"),
    telefon: findFieldValue(fields, "telefon"),
    epost: findFieldValue(fields, "epost"),
    saksnummer: findFieldValue(fields, "saksnummer"),
    soker: findFieldValue(fields, "soker"),
    sokerAdresse: findFieldValue(fields, "sokerAdresse"),
    eiendomAdresse: findFieldValue(fields, "eiendomAdresse"),
    gbnr: findFieldValue(fields, "gbnr"),
    tiltakType: appData.applicationType,
    storrelse: findNumericFieldValue(fields, "fields.distances.size"),
    materiale: findFieldValue(fields, "materiale"),
    hoyde: findNumericFieldValue(fields, "fields.distances.mønehøyde"),
    takvinkel: findNumericFieldValue(fields, "takvinkel"),
    nabogrense: findNumericFieldValue(
      fields,
      "fields.distances.neighbor_boundary",
    ),
    beskrivelse: findFieldValue(fields, "description"),
  };
};
