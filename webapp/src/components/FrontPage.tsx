/**
 * This file is used in Utstillingsvindu 2.0
 */

import React, { useState } from 'react';

type ChecklistItemProps = {
  text: string;
  isChecked: boolean;
  onToggle: () => void;
};

const ChecklistItem: React.FC<ChecklistItemProps> = ({ text, isChecked, onToggle }) => (
  <li
    className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors ${
      isChecked ? 'bg-blue-200' : 'hover:bg-blue-50'
    }`}
    onClick={onToggle}
  >
    <div
      className={`w-5 h-5 border-2 rounded mr-3 flex items-center justify-center ${
        isChecked ? 'bg-kartAI-blue border-kartAI-blue text-white' : 'border-gray-400'
      }`}
    >
      {isChecked && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </div>
    <span className={isChecked ? 'font-medium' : ''}>{text}</span>
  </li>
);

const Checklist: React.FC<{
  items: string[];
  checkedItems: Record<number, boolean>;
  onItemToggle: (index: number) => void;
}> = ({ items, checkedItems, onItemToggle }) => (
  <div className="border-2 rounded-lg p-4 bg-blue-100 border-kartAI-blue">
    <h2 className="text-lg font-medium mb-2">Har du alt på plass?</h2>
    <ul className="space-y-2">
      {items.map((item, index) => (
        <ChecklistItem
          key={index}
          text={item}
          isChecked={!!checkedItems[index]}
          onToggle={() => onItemToggle(index)}
        />
      ))}
    </ul>
  </div>
);

const InformationBox: React.FC = () => (
  <div className="border-4 rounded-lg p-4 border-kartAI-blue mb-4">
    <h2 className="text-xl font-medium mb-2">KORT FORTALT</h2>
    <p>
      En byggesøknad er nødvendig for å sikre at prosjektet ditt følger lover og regler.
      Start tidlig, samle alle dokumenter, og bruk gjerne vår digitale søknadsløsning for en enklere prosess.
    </p>

    <h2 className="text-lg font-medium mb-2 mt-4">Når trenger du byggesøknad?</h2>
    <p>Du må søke om byggesøknad ved:</p>
    <ul className="list-disc ml-7 space-y-1">
      <li>Nybygg av bolig, garasje eller uthus</li>
      <li>Tilbygg eller større ombygging</li>
      <li>Endring av bygningens bruksområde</li>
      <li>Bygninger over 25m² (avhengig av kommunale bestemmelser)</li>
    </ul>
    <p className="italic mt-4">Ønsker du hjelp? Bruk chatbotten vår for veiledning underveis!</p>
  </div>
);

const VideoEmbed: React.FC = () => (
  <iframe
    width="100%"
    height="100%"
    src="https://www.youtube.com/embed/s6oTf12Q-rY"
    title="YouTube video player"
    frameBorder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowFullScreen
    className="rounded-lg shadow-md h-[255px] w-full"
  />
);

const FrontPage: React.FC = () => {
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  const checklistItems = [
    "Vet du hva du skal bygge?",
    "Vet du om du må søke om dispensasjon?",
    "Har du alle dokumentene på plass?",
    "Har du varslet naboene?",
  ];

  const toggleCheck = (index: number) => {
    setCheckedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <div className="p-4 mb-8">
      <h1 className="text-3xl pt-4 font-bold flex justify-center text-kartAI-blue mb-8">
        Informasjon om byggesøknaden
      </h1>
      <div className="md:mx-20">
        <InformationBox />

        <div data-cy="main-container" className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="w-full md:w-1/2" data-cy="right-column">
            <Checklist
              items={checklistItems}
              checkedItems={checkedItems}
              onItemToggle={toggleCheck}
            />
          </div>

          <div className="w-full md:w-1/2" data-cy="left-column">
            <VideoEmbed />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FrontPage;