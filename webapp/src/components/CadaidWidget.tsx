"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
interface CadaidWidgetProps {
  setHasInputCadaidWidget: (value: boolean) => void;
  hasInputCadaidWidget: boolean;
  reportUrl: string;
}
interface response {
  message: string;
  type: string;
}

export function CadaidWidget({
  setHasInputCadaidWidget,
  hasInputCadaidWidget,
  reportUrl,
}: CadaidWidgetProps) {
  const [cadaidRespons, setCadaidRespons] = useState<response[]>([]);
  const router = useRouter();

  const handleNavigation = () => {
    router.push(reportUrl);
  };

  const hardcodedRespons = [
    { message: "Du har fasade", type: "CONFIRMED" },
    { message: "Du mangler snit", type: "MISSING" },
    { message: "Du mangler situasjons kart", type: "MISSING" },
  ];

  const handleClick = () => {
    handleNavigation();
    if (!hasInputCadaidWidget) {
      setHasInputCadaidWidget(true);
      localStorage.setItem("CadaidRespons", JSON.stringify(hardcodedRespons));
    }
  };
  useEffect(() => {
    if (cadaidRespons.length > 0) {
      localStorage.setItem("CadaidRespons", JSON.stringify(cadaidRespons));
    }
  }, [cadaidRespons]);

  useEffect(() => {
    const storedCadaidRespons = localStorage.getItem("CadaidRespons");

    if (storedCadaidRespons) {
      try {
        const parsedRespons: response[] = JSON.parse(
          storedCadaidRespons,
        ) as response[];
        setCadaidRespons(parsedRespons);

        if (parsedRespons.length > 0) {
          setHasInputCadaidWidget(true);
        }
      } catch {
        console.error("respons could not be parsed");
      }
    }
  }, [setHasInputCadaidWidget]);

  return (
    <section
      data-cy="cadaid-widget"
      className="cursor-pointer rounded-md border p-4 shadow-md transition-all hover:shadow-lg lg:col-span-2"
      onClick={handleClick}
    >
      <div className="flex items-center justify-between">
        <h1 className="text-xlwebapp/src/app/for-soknad/byggeideer/dashbord/page.tsx font-bold">
          Få oversikt over plantegninger
        </h1>
        <Image
          src={
            hasInputCadaidWidget
              ? "/Ikoner/Dark/SVG/Check, Success.svg"
              : "/Ikoner/Dark/SVG/Warning.svg"
          }
          alt={hasInputCadaidWidget ? "hake" : "varselsymbol"}
          className="rounded-sm bg-kartAI-blue p-1"
          width={30}
          height={30}
        />
      </div>
      {hasInputCadaidWidget ? (
        <ul>
          {cadaidRespons.map((response, index) => (
            <li
              className={`${response.type === "MISSING" ? "text-red-600" : "text-black"}`}
              key={index}
            >
              {response.message}
            </li>
          ))}
        </ul>
      ) : (
        <div>
          <p>
            Laste opp plantegning for å få se hva som må legges til før du
            skriver søknad
          </p>
        </div>
      )}
    </section>
  );
}
