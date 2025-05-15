"use client";
import React, { useEffect, useState, useMemo } from "react";
import { PickAddress } from "~/components/PickAddress";
import { TodoList } from "~/components/TodoList";
import { CadaidWidget } from "~/components/CadaidWidget";
import { DigitalTiltaksdataWidget } from "~/components/DigitalTilraksdataWidget";
import { ThreeDVisningWidget } from "~/components/ThreeDVisningWidgit";
import { Button } from "~/components/ui/button";
import CaseDocumentsComponent from "~/components/CaseDocuments";
import { ArkivGPTWidget } from "~/components/ArkivGPTWidget";
import { useRouter } from "next/navigation";
import { PlanPrat } from "~/components/PlanPrat";

interface UserDashboardProps {
  BASE_URL: string;
}

export default function UserDashboard({ BASE_URL }: UserDashboardProps) {
  const [hasInputPickAddress, setHasInputPickAddress] =
    useState<boolean>(false);
  const [hasInputCadaidWidget, setHasInputCadaidWidget] =
    useState<boolean>(false);
  const [
    hasInputDigitalTiltaksdataWidget,
    setHasInputDigitalTiltaksdataWidget,
  ] = useState<boolean>(false);
  const [hasInputThreeDVisningWidget, setHasInputThreeDVisningWidget] =
    useState<boolean>(false);

  const router = useRouter();

  const handleNavigation = () => {
    router.push("https://www.kristiansand.kommune.no/");
  };

  const [documentList, setDocumentList] = useState<Array<{ name: string; url: string }>>([]);

  // Use useMemo to prevent recreating the documents array on every render
  const documents = useMemo(
    () => [
      { name: "Plantegning.pdf", url: BASE_URL + "/" + "Plantegning.pdf" },
      { name: "Snitt_øst.jpg", url: BASE_URL + "/" + "Snitt_øst.jpg" },
      { name: "Snitt_vest.jpg", url: BASE_URL + "/" + "Snitt_vest.jpg" },
      { name: "Snitt_nord.jpg", url: BASE_URL + "/" + "Snitt_nord.jpg" },
    ],
    [BASE_URL]
  ); // Only re-create if BASE_URL changes

  useEffect(() => {
    if (hasInputCadaidWidget) {
      setDocumentList((prevList) => [...prevList, ...documents]);
    }
  }, [hasInputCadaidWidget, documents]); // Now documents won't cause unnecessary re-renders

  return (
    <div className="ml-14 mr-14 min-h-screen">
      <h1 data-cy="title" className="text-3xl">
        <strong>Organiser min byggeidee</strong>
      </h1>
      <p className="mb-4 mt-4">
        På denne siden kan du legge inn det du vet om dine byggeplan og få
        respons fra våre KI hjelpere
      </p>
      <PickAddress
        setHasInputPickAddress={setHasInputPickAddress}
        hasInputPickAddress={hasInputPickAddress}
      />
      <section className="mt-4 grid grid-cols-1 gap-10 lg:grid-cols-6 lg:grid-rows-2">
        <TodoList
          hasInputPickAddress={hasInputPickAddress}
          hasInputCadaidWidget={hasInputCadaidWidget}
          hasInputDigitalTiltaksdataWidget={hasInputDigitalTiltaksdataWidget}
          hasInputThreeDVisningWidget={hasInputThreeDVisningWidget}
        />
        <CadaidWidget
          setHasInputCadaidWidget={setHasInputCadaidWidget}
          hasInputCadaidWidget={hasInputCadaidWidget}
          reportUrl={BASE_URL + "/cadaid"}
        />

        <div data-cy="planprat" className="row-span-3 lg:col-span-2">
          <PlanPrat />
        </div>
        <DigitalTiltaksdataWidget
          hasInputDigitalTiltaksdataWidget={hasInputDigitalTiltaksdataWidget}
          setHasInputDigitalTiltaksdataWidget={
            setHasInputDigitalTiltaksdataWidget
          }
        />
        <ArkivGPTWidget hasInputPickAddress={hasInputPickAddress} />
        <div className="grid w-full grid-cols-1 gap-10 lg:col-span-6 lg:flex">
          <ThreeDVisningWidget
            setHasInputThreeDVisningWidget={setHasInputThreeDVisningWidget}
            hasInputThreeDVisningWidget={hasInputThreeDVisningWidget}
          />
          <div data-cy="document-overview">
            <CaseDocumentsComponent documents={documentList} />
          </div>

          <Button
            data-cy="start-application-button"
            className="bg-kartAI-blue"
            onClick={handleNavigation}
          >
            Gå til søknad
          </Button>
        </div>
      </section>
    </div>
  );
}
