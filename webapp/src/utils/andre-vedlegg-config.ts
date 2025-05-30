const ACCEPTED_FILE_TYPES = {
  "image/*": [".png", ".jpg", ".jpeg", ".tiff", ".bmp"],
  "application/pdf": [".pdf"],
  "application/dwg": [".dwg"],
  "application/dxf": [".dxf"],
  "image/vnd.dwg": [".dwg"],
  "image/vnd.dxf": [".dxf"],
};

const DOCUMENT_CHECKLIST = [
  {
    title: "Situasjonskart",
    description:
      "hvor jeg har tegnet inn det jeg skal bygge/rive, og relevante avstander",
  },
  {
    title: "Plantegning",
    description: "før og etter",
  },
  {
    title: "Snittegning",
    description: "før og etter",
  },
  {
    title: "Fasadetegninger",
    description: "før og etter",
  },
  {
    title: "Nabovarsel",
    subItems: [
      "Et eksemplar av komplett nabovarsel med alle vedlegg",
      "Dokumentasjon på at alle naboer er varslet (f.eks. kvitteringer)",
      "Eventuelle merknader fra naboer",
      "Dine kommentarer fra naboens merknader",
    ],
  },
  {
    title: "Dispensasjon",
    description: "hvis aktuelt",
    subItems: [
      "Søknader om dispensasjon eller innvilget dispensasjon (spesifiser i feltet under)",
      "Uttalelser/vedtak fra annen myndighet (spesifiser i feltet under)",
    ],
  },
];

export { ACCEPTED_FILE_TYPES, DOCUMENT_CHECKLIST };
